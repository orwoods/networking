import type { ServiceError } from '@grpc/grpc-js';

export type TLogger = {
  info: (...args: any[]) => any;
  error: (...args: any[]) => any;
};

export interface IGrpcClient {
  handleGrpcError (error: ServiceError);
  handleCommonError (error: Error);
  getProps (): Promise<{
    host: string;
    port: number;
    tls: boolean;
    timeoutMs: number | undefined;
  }>;
  start ();
  stop ();
  restart ();
}
