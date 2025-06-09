import { Metadata, StatusObject, status as Status } from '@grpc/grpc-js';

export abstract class AbstractGrpcError<MetadataKey extends string, MetadataValue extends string> extends Error implements StatusObject {
  public static readonly Statuses = Status;

  public details: string;
  public code: Status;
  public metadata: Metadata;

  constructor(details: string, code?: Status, metadata?: Metadata | Record<MetadataKey, MetadataValue>) {
    super(details);
    this.details = details;
    this.code = code || Status.UNKNOWN;

    if (metadata instanceof Metadata) {
      this.metadata = metadata;
    } else if (typeof metadata === 'object') {
      this.metadata = new Metadata();

      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof value !== 'string') {
          return;
        }

        this.metadata.set(key, value);
      });
    } else {
      this.metadata = new Metadata();
    }
  }
};
