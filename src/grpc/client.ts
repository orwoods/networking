import * as grpc from '@grpc/grpc-js';
import { ClientOptions, ServiceError } from '@grpc/grpc-js';
import { TLogger } from '../types';
import { callWithTimeout, wait } from '../utils';

export { ClientOptions };
export { ServiceError };
export { grpc };

export type ClientConstructor <C> = new (address: string, credentials: grpc.ChannelCredentials, opt?: ClientOptions) => C;

export type QueuedRequest = {
  fn: () => Promise<any>;
  defaultFn: () => any;
  timeoutMs?: number;
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
      grpcStatusesForReconnect: [
        grpc.status.UNAVAILABLE,
        grpc.status.DEADLINE_EXCEEDED,
        grpc.status.INTERNAL,
        grpc.status.RESOURCE_EXHAUSTED,
        grpc.status.UNKNOWN,
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
      const credentials: grpc.ChannelCredentials = Number(tls) ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
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

              const { request: { fn, defaultFn, timeoutMs }, resolve, reject } = requestPromise;

              try {
                resolve(await this.makeRequest(fn, defaultFn, timeoutMs));
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

      (() => this.connect())();
    }
  }

  public async stop () {
    if (this.checkConnectivityTimeout) {
      clearTimeout(this.checkConnectivityTimeout);
    }

    if (this.client) {
      this.logger.info('GrpcClient stop');

      this.client.close();
    }

    this.justConnected = false;
    this.justConnecting = false;
  }

  public async restart () {
    this.logger.info('GrpcClient restart');

    await this.connect();
  }

  public async makeRequest <T> (fn: () => Promise<T>, defaultFn: () => T, timeoutMs?: number): Promise<T> {
    const request: QueuedRequest = { fn, defaultFn, timeoutMs };

    if (this.connecting || !this.connected) {
      return this.enqueueRequest(request);
    }

    if (typeof timeoutMs === 'undefined') {
      timeoutMs = this.config.requestTimeoutMs;
    }

    try {
      return await callWithTimeout(fn(), timeoutMs);
    } catch (err: any) {
      if (err.code && err.metadata && err.metadata instanceof grpc.Metadata) {
        this.handleGrpcError(err, request);
      } else {
        this.handleCommonError(err, request);
      }
    }

    return defaultFn();
  }

  protected handleStopReconnection (error: Error) {
    this.logger.error('GrpcClient handleStopReconnection. The server is not available. Connection attempts have been terminated', error);
  }

  protected handleCommonError (error: Error, request: QueuedRequest) {
    this.logger.error('GrpcClient error (common)', error, request);
  }

  protected handleGrpcError (error: ServiceError, request: QueuedRequest) {
    this.logger.error('GrpcClient error (grpc)', { data: JSON.parse(JSON.stringify(error)) }, request);

    if (this.config.grpcStatusesForReconnect.includes(error.code)) {
      this.enqueueRequest(request);

      this.restart();
    }
  }

  protected getGrpcOptions (): ClientOptions {
    return {
      'grpc.max_receive_message_length': 50 * 1024 * 1024,
    };
  }

  private enqueueRequest <T> (request: QueuedRequest): Promise<T> {
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
