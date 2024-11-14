import * as grpc from '@grpc/grpc-js';
import { ClientOptions, ServiceError } from '@grpc/grpc-js';
import { IGrpcClient, TLogger } from './types';
import { callWithTimeout, wait } from './utils';

export { ClientOptions };
export { ServiceError };

export abstract class GrpcClient <C extends grpc.Client> implements IGrpcClient {
  public static readonly STATUS = grpc.status;

  private static CHECK_CONNECTIVITY_INTERVAL_MS = 5 * 1000;

  protected client!: C;
  private checkConnectivityTimeout!: ReturnType<typeof setTimeout>;
  private logger: TLogger;

  constructor (logger: TLogger = console) {
    this.logger = logger;
  }

  public async init (Client: new (address: string, credentials: grpc.ChannelCredentials, options?: ClientOptions) => C) {
    const { host, port, tls } = await this.getProps();

    const url = `${host}:${port}`;
    const credentials: grpc.ChannelCredentials = Number(tls) ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
    const options = this.getGrpcOptions();

    this.logger.info('GrpcClient init', { url, tls, options });

    if (this.client) {
      this.stop();
    }

    this.client = new Client(url, credentials, options);

    this.start();
  }

  public async start () {
    this.logger.info('GrpcClient start');

    if (this.checkConnectivityTimeout) {
      clearTimeout(this.checkConnectivityTimeout);
    }

    this.checkConnectivityState();
  }

  public async stop () {
    this.logger.info('GrpcClient stop');

    if (this.checkConnectivityTimeout) {
      clearTimeout(this.checkConnectivityTimeout);
    }

    this.client.close();

    await wait(1000);
  }

  public async restart () {
    this.logger.info('GrpcClient restart');

    await this.stop();
    await this.start();
  }

  public handleCommonError (error: Error) {
    this.logger.error('GrpcClient error (common)', error);
  }

  public handleGrpcError (error: ServiceError) {
    this.logger.error('GrpcClient error (grpc)', { data: JSON.parse(JSON.stringify(error)) });

    if (error.code === GrpcClient.STATUS.UNAVAILABLE) {
      this.restart();
    }
  }

  protected getGrpcOptions (): ClientOptions {
    return {
      'grpc.max_receive_message_length': 50 * 1024 * 1024,
    };
  }

  protected async makeRequest <T> (fn: () => Promise<T>, defaultFn: () => T, timeoutMs?: number): Promise<T> {
    if (typeof timeoutMs === 'undefined') {
      ({ timeoutMs } = await this.getProps());
    }

    try {
      return (typeof timeoutMs !== 'undefined')
        ? await callWithTimeout(fn(), timeoutMs)
        : await fn();
    } catch (err: any) {
      if (err.code && err.metadata && err.metadata instanceof grpc.Metadata) {
        this.handleGrpcError(err);
      } else {
        this.handleCommonError(err);
      }
    }

    return defaultFn();
  }

  private checkConnectivityState (): void {
    this.client.getChannel().getConnectivityState(true);

    this.checkConnectivityTimeout = setTimeout(this.checkConnectivityState.bind(this), GrpcClient.CHECK_CONNECTIVITY_INTERVAL_MS);
  }

  public abstract getProps (): Promise<{ host: string; port: number; tls: boolean; timeoutMs: number | undefined }>;
}
