import {
  Server,
  ServerOptions,
  ServerCredentials,
  ServiceDefinition,
  UntypedServiceImplementation,
} from '@grpc/grpc-js';
import { TLogger } from '../types';
import { wait } from '../utils';

export { ServerOptions };

export abstract class GrpcServer <IMethods extends UntypedServiceImplementation, IService extends ServiceDefinition<IMethods>> {
  protected server: Server;
  private logger: TLogger;
  private activeUrl?: string;

  public constructor (service: IService, methods: IMethods, options?: ServerOptions, logger: TLogger = console) {
    this.server = new Server(options);
    this.server.addService(service, methods);
    this.logger = logger;
  }

  public async start () {
    await this.stop();

    const { host, port, tls } = await this.getProps();

    this.activeUrl = `${host}:${port}`;
    const credentials = Number(tls) ? ServerCredentials.createSsl(null, [], false) : ServerCredentials.createInsecure();

    let success: (value: void | PromiseLike<void>) => void;
    let failure: (reason?: any) => void;

    const promise = new Promise<void>((resolve, reject) => {
      success = resolve;
      failure = reject;
    });

    this.server.bindAsync(this.activeUrl, credentials, (error) => {
      if (error) {
        this.logger.error('GrpcServer error', error);

        return failure();
      }

      this.logger.info('GrpcServer server started', { host, port, tls });

      success();
    });

    return promise;
  }

  public async stop () {
    if (this.activeUrl) {
      this.server.drain(this.activeUrl, 1000);
      this.server.unbind(this.activeUrl);

      this.activeUrl = undefined;

      await wait(1000);
    }
  }

  abstract getProps(): Promise<{ host: string; port: number; tls: boolean }>;
}
