import {
  Server,
  ServerOptions,
  ServerCredentials,
  ServiceDefinition,
  UntypedServiceImplementation,
} from '@grpc/grpc-js';
import { TLogger } from '../types';

export { ServerOptions };

export abstract class GrpcServer <SI extends UntypedServiceImplementation> {
  protected server!: Server;
  private methods?: SI;

  protected async init (service: ServiceDefinition<SI>, options?: ServerOptions, logger: TLogger = console) {
    const { host, port, tls } = await this.getProps();

    const url = `${host}:${port}`;

    logger.info('GrpcServer init', { url, tls, options });

    if (!this.methods) {
      logger.info('Skip init');

      return;
    }

    const credentials = Number(tls) ? ServerCredentials.createSsl(null, [], false) : ServerCredentials.createInsecure();

    this.server = new Server(options);
    this.server.addService(service, this.methods);
    this.server.bindAsync(url, credentials, (error) => {
      if (error) {
        logger.error('GrpcServer error', error);

        return;
      }

      logger.info('GrpcServer server started');
    });
  }

  protected registerMethods (methods: SI) {
    this.methods = methods;
  }

  abstract getProps(): Promise<{ host: string; port: number; tls: boolean }>;
}
