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
  private activePort?: string;

  public constructor (service: IService, methods: IMethods, options?: ServerOptions, logger: TLogger = console) {
    this.server = new Server(options);
    this.server.addService(service, methods);
    this.logger = logger;
  }

  protected async start () {
    const { host, port, tls } = await this.getProps();

    const url = `${host}:${port}`;
    const credentials = Number(tls) ? ServerCredentials.createSsl(null, [], false) : ServerCredentials.createInsecure();

    await this.stop();

    this.activePort = String(port);

    let success: (value: void | PromiseLike<void>) => void;
    let failure: (reason?: any) => void;

    const promise = new Promise<void>((resolve, reject) => {
      success = resolve;
      failure = reject;
    });

    this.server.bindAsync(url, credentials, (error) => {
      if (error) {
        this.logger.error('GrpcServer error', error);

        return failure();
      }

      this.logger.info('GrpcServer server started');

      success();
    });

    return promise;
  }

  protected async stop () {
    if (this.activePort) {
      this.server.drain(this.activePort, 1000);
      await wait(1000);
      this.server.unbind(this.activePort);
    }
  }

  abstract getProps(): Promise<{ host: string; port: number; tls: boolean }>;
}
