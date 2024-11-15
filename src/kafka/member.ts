import { KafkaConnectionStatus, TLogger } from '../types';

export abstract class KafkaMember <Client extends { disconnect (): Promise<void> }> {
  private status: KafkaConnectionStatus;

  protected client!: Client | undefined;
  protected memberName: string;
  protected errorsCounter: number;
  protected logger: TLogger;

  public constructor (memberName: string, logger: TLogger = console) {
    this.memberName = memberName;
    this.logger = logger;
    this.status = 'disconnected';
    this.errorsCounter = 0;
  }

  public get connected () {
    return this.status === 'connected';
  }

  public get disconnected () {
    return this.status === 'disconnected';
  }

  public get connecting () {
    return this.status === 'connecting';
  }

  public get totalErrors () {
    return this.errorsCounter;
  }

  async healthCheck (): Promise<boolean> {
    try {
      await this.ready();
    } catch (e) {
      this.logger.error(`${this.memberName}: healthCheck error`, e);
    }

    return this.connected;
  }

  public async disconnect (): Promise<void> {
    this.logger.info(`${this.memberName}: disconnect`);

    if (this.client) {
      await this.client.disconnect();

      this.client = undefined;
    }

    this.setStatus('disconnected');
  }

  protected setStatus (status: KafkaConnectionStatus) {
    this.status = status;
  }

  protected afterDisconnect () {
    this.client = undefined;

    this.setStatus('disconnected');

    this.logger.info(`${this.memberName}: disconnected`);
  }

  protected abstract ready (): Promise<void>;
}
