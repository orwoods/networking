import { Metadata, StatusObject, status as Status } from '@grpc/grpc-js';

export class AbstractGrpcError<MetadataType extends { [_: string]: string }> extends Error implements StatusObject {
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
        if (typeof value !== 'string' || typeof key !== 'string') {
          return;
        }

        this.metadata.set(key, value);
      });
    } else {
      this.metadata = new Metadata();
    }
  }

  static fromError<ErrorClassType extends AbstractGrpcError<{}>> (error: Error | StatusObject): ErrorClassType {
    if (error instanceof AbstractGrpcError) {
      return error as ErrorClassType;
    }

    if (error && !(error instanceof Error)) {
      const code = error.code || Status.UNKNOWN;
      const details = error.details || 'An unknown error occurred';
      const metadata = error.metadata || new Metadata();

      return new AbstractGrpcError(details, code, metadata) as ErrorClassType;
    }

    return new AbstractGrpcError(error.message) as ErrorClassType;
  }
};
