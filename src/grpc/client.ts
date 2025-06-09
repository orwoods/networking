import * as grpc from '@grpc/grpc-js';
import { ClientOptions, ServiceError } from '@grpc/grpc-js';
import { TLogger } from '../types';
import { callWithTimeout, wait } from '../utils';
import { AbstractGrpcError } from './errors';

export { ClientOptions };
export { ServiceError };
export { grpc };

export type ClientConstructor <C> = new (address: string, credentials: grpc.ChannelCredentials, opt?: ClientOptions) => C;

type TDefaultErrorClassType = AbstractGrpcError<{}>;

type TOnError<ErrorClassType extends TDefaultErrorClassType, ResponseType = any> = (error: ErrorClassType)
=> ResponseType | undefined | void;

export type QueuedRequest<ResponseType = any, ErrorClassType extends TDefaultErrorClassType = any> = {
  fn: () => Promise<ResponseType>;
  defaultFn?: () => ResponseType;
  onError?: TOnError<ErrorClassType>;
  timeoutMs?: number;
  attempt: number;
};

export type QueuedRequestPromise = {
  request: QueuedRequest;
  resolve: (value: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
};

export type ClientConfig = {
  host: string;
  port: number;
  tls: boolean;
  requestTimeoutMs: number;
  connectionTimeoutMs: number;
  reconnectionDelayMs: number;
  maxReconnectionAttempts: number;
  maxRequestAttempts: number;
  grpcStatusesForReconnect: grpc.status[]
};

export abstract class GrpcClient <C extends grpc.Client> {
  private static CHECK_CONNECTIVITY_INTERVAL_MS = 5 * 1000;

  protected client!: C;
  private ClientConstructor!: ClientConstructor <C>;
  private checkConnectivityTimeout!: ReturnType<typeof setTimeout>;
  private logger: TLogger;
  private justConnecting: boolean;
  private justConnected: boolean;
  private failedReconnectionAttempts: number;

  private queuedRequestPromises: QueuedRequestPromise[];

  private defaultConfig: ClientConfig;
  private config: ClientConfig;

  constructor (ClientConstructor: ClientConstructor <C>, logger: TLogger = console) {
    this.ClientConstructor = ClientConstructor;
    this.logger = logger;
    this.justConnecting = false;
    this.justConnected = false;
    this.failedReconnectionAttempts = 0;
    this.queuedRequestPromises = [];
    this.defaultConfig = {
      host: '0.0.0.0',
      port: 50051,
      tls: false,
      requestTimeoutMs: 60 * 1000,
      connectionTimeoutMs: 10 * 1000,
      reconnectionDelayMs: 1 * 1000,
      maxReconnectionAttempts: 50,
      maxRequestAttempts: 1,
      grpcStatusesForReconnect: [
        grpc.status.UNAVAILABLE,
        grpc.status.DEADLINE_EXCEEDED,
        grpc.status.INTERNAL,
        grpc.status.RESOURCE_EXHAUSTED,
        grpc.status.DATA_LOSS,
      ],
    };
    this.config = this.defaultConfig;
  }

  public get connected () {
    return this.justConnected;
  }

  public get connecting () {
    return this.justConnecting;
  }

  public async connect () {
    if (this.justConnecting) {
      return;
    }

    await this.stop();

    this.justConnecting = true;

    try {
      this.applyConfig(await this.getProps());

      this.logger.info('GrpcClient connect', this.config);

      const { host, port, tls, connectionTimeoutMs } = this.config;

      const credentials: grpc.ChannelCredentials = Number(tls)
        ? grpc.credentials.createSsl(null, null, null, { rejectUnauthorized: false })
        : grpc.credentials.createInsecure();

      this.client = new this.ClientConstructor(`${host}:${port}`, credentials, this.getGrpcOptions());

      await new Promise<void>((connectionResolve, connectionReject) => {
        this.client.waitForReady(new Date().getTime() + connectionTimeoutMs, (error) => {
          if (error) {
            return connectionReject(error);
          }

          this.justConnecting = false;
          this.justConnected = true;

          this.logger.info('GrpcClient connected');

          this.onInit();

          connectionResolve();

          while (this.queuedRequestPromises.length > 0) {
            (async (requestPromise: QueuedRequestPromise | undefined) => {
              if (!requestPromise) {
                return;
              }

              const { request, resolve, reject } = requestPromise;

              try {
                resolve(await this.makeRequest(request));
              } catch (error) {
                reject(error);
              }
            })(this.queuedRequestPromises.shift());
          }
        });
      });

      this.checkConnectivityState();
    } catch (error: any) {
      this.logger.error('GrpcClient connect error', error, this.config);

      this.failedReconnectionAttempts++;

      if (this.failedReconnectionAttempts > this.config.maxReconnectionAttempts) {
        this.failedReconnectionAttempts = 0;

        return this.handleStopReconnection(error);
      }

      await wait(this.config.reconnectionDelayMs);

      this.justConnecting = false;

      this.logger.info(`GrpcClient trying to reconnect ${this.failedReconnectionAttempts} / ${this.config.maxReconnectionAttempts}`);

      return this.connect();
    }
  }

  public async stop () {
    if (this.checkConnectivityTimeout) {
      clearTimeout(this.checkConnectivityTimeout);
    }

    if (this.client) {
      this.logger.warn('GrpcClient stop');

      this.client.close();
    }

    this.justConnected = false;
    this.justConnecting = false;
  }

  public async restart () {
    this.logger.info('GrpcClient restart');

    await this.connect();
  }

  public async makeRequest <T, E extends TDefaultErrorClassType = TDefaultErrorClassType> ({
    fn,
    defaultFn,
    onError,
    timeoutMs,
    attempt,
  }: {
    fn: () => Promise<T>;
    defaultFn?: QueuedRequest<T>['defaultFn'];
    onError?: TOnError<E, T>;
    timeoutMs?: QueuedRequest['timeoutMs'];
    attempt?: QueuedRequest['attempt'];
  }): Promise<T> {
    const request: QueuedRequest<T, E> = { fn, defaultFn, onError, timeoutMs, attempt: attempt || 0 };

    if (this.connecting || !this.connected) {
      return this.enqueueRequest<T, E>(request);
    }

    if (typeof timeoutMs === 'undefined') {
      timeoutMs = this.config.requestTimeoutMs;
    }

    let exportError: TDefaultErrorClassType | undefined;

    try {
      return await callWithTimeout(fn(), timeoutMs);
    } catch (err: any) {
      exportError = AbstractGrpcError.fromError<E>(err);

      if (err.code && err.metadata && err.metadata instanceof grpc.Metadata) {
        this.handleGrpcError(err, request);

        request.attempt++;

        const canRetry = request.attempt < this.config.maxRequestAttempts;

        if (this.config.grpcStatusesForReconnect.includes(err.code)) {
          setTimeout(() => this.restart(), 0);

          if (canRetry) {
            return this.enqueueRequest(request);
          }
        } else if (canRetry) {
          return this.makeRequest(request);
        }
      } else {
        this.handleCommonError(err, request);
      }
    }

    if (onError && exportError) {
      const result = onError(exportError as E);

      if (result !== undefined) {
        return result;
      }
    }

    if (defaultFn) {
      return defaultFn();
    }

    throw new Error('GrpcClient makeRequest error: ' + (exportError ? exportError.message : 'Unknown error'));
  }

  protected handleStopReconnection (error: Error) {
    this.logger.error('GrpcClient handleStopReconnection. The server is not available. Connection attempts have been terminated', error);
  }

  protected handleCommonError (error: Error, request: QueuedRequest) {
    this.logger.error('GrpcClient error (common)', error, request);
  }

  protected handleGrpcError (error: ServiceError, request: QueuedRequest) {
    this.logger.error('GrpcClient error (grpc)', { data: JSON.parse(JSON.stringify(error)) }, request);
  }

  protected getGrpcOptions (): ClientOptions {
    return {
      'grpc.max_receive_message_length': 50 * 1024 * 1024,
    };
  }

  private enqueueRequest <T, E extends TDefaultErrorClassType = TDefaultErrorClassType> (request: QueuedRequest<T, E>): Promise<T> {
    return new Promise<T>(((resolve, reject) => {
      this.queuedRequestPromises.push({
        request,
        resolve,
        reject,
      });
    }));
  }

  private checkConnectivityState (): void {
    this.client.getChannel().getConnectivityState(true);

    this.checkConnectivityTimeout = setTimeout(this.checkConnectivityState.bind(this), GrpcClient.CHECK_CONNECTIVITY_INTERVAL_MS);
  }

  private applyConfig (props: Partial<ClientConfig> = {}) {
    Object.entries(this.defaultConfig).forEach(([key, defaultValue]) => {
      let value = (typeof props[key] !== 'undefined') ? props[key] : defaultValue;;

      if (key.endsWith('Ms') || key.endsWith('Attempts')) {
        if (!isFinite(Number(value)) || value < 0) {
          value = defaultValue;
        }
      }

      this.config[key] = value;
    });
  }

  protected abstract onInit (): void;
  protected abstract getProps (): Promise<Partial<ClientConfig>>;
}
