import { Kafka, Consumer, KafkaConfig, ConsumerConfig } from 'kafkajs';
import { TLogger } from '../types';
import { KafkaMember } from './member';

export abstract class KafkaConsumer extends KafkaMember <Consumer> {
  public constructor (logger: TLogger = console) {
    super('KafkaConsumer', logger);
  }

  public async subscribe (topics: string | string[], fromBeginning = false): Promise<void> {
    await this.ready();

    if (!this.client) {
      return;
    }

    await this.client.subscribe({ topics: Array.isArray(topics) ? topics : [topics], fromBeginning });

    await this.client.run({
      eachMessage: async (payload) => {
        try {
          await this.onMessage(payload.topic, payload.message.value);
        } catch (error) {
          this.logger.error(`${this.memberName}: message processing error`, error);

          this.errorsCounter++;
        }
      },
    });

    this.logger.info(`${this.memberName}: subscribed`, topics);
  }

  protected async ready (): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.disconnected) {
      await this.init();
    }

    if (!this.client) {
      return;
    }

    if (this.connecting) {
      return;
    }

    this.setStatus('connecting');

    try {
      await this.client.connect();

      this.setStatus('connected');
    } catch (error) {
      this.setStatus('disconnected');
      throw error;
    }
  }

  private async init (): Promise<void> {
    const config = await this.getConfig();
    const consumerConfig = await this.getConsumerConfig();

    const kafka = new Kafka(config);

    this.client = kafka.consumer(consumerConfig);

    this.client.on('consumer.disconnect', async () => {
      this.afterDisconnect();
    });
  }

  abstract getConfig(): Promise<KafkaConfig>;
  abstract getConsumerConfig(): Promise<ConsumerConfig>;
  abstract onMessage (topic: string, data: Buffer | null): Promise<void>;
}
