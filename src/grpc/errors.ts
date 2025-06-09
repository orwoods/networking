import { Metadata, StatusObject, status as Status } from '@grpc/grpc-js';

export class AbstractGrpcError<MetadataType extends { [_: string]: string | number | Buffer }> extends Error implements StatusObject {
  public static readonly Statuses = Status;

  public details: string;
  public code: Status;
  public metadata: Metadata;

  constructor(details: string, code?: Status, metadata?: Metadata | MetadataType) {
    super(details);
    this.details = details;
    this.code = code || Status.UNKNOWN;

    if (metadata instanceof Metadata) {
      this.metadata = metadata;
    } else if (typeof metadata === 'object') {
      this.metadata = new Metadata();

      Object.entries(metadata).forEach(([key, value]) => {
        if (value instanceof Buffer) {
          this.metadata.set(key, value.toString('hex'));
        } else if (typeof value === 'number') {
          this.metadata.set(key, value.toString());
        } else if (typeof value === 'string') {
          this.metadata.set(key, value);
        } else {
          this.metadata.set(key, JSON.stringify(value));
        }
      });
    } else {
      this.metadata = new Metadata();
    }
  }

  static fromError<ErrorClassType extends AbstractGrpcError<{}>> (error: Error | StatusObject): ErrorClassType {
    if (error instanceof AbstractGrpcError) {
      return error as ErrorClassType;
    }

    if (error && ('code' in error) && ('metadata' in error) && error.metadata instanceof Metadata) {
      const code = error.code || Status.UNKNOWN;
      const details = error.details || 'An unknown error occurred';
      const metadata = error.metadata || new Metadata();

      return new AbstractGrpcError(details, code, metadata) as ErrorClassType;
    }

    return new AbstractGrpcError('message' in error ? error.message : 'Unknown error') as ErrorClassType;
  }
};
