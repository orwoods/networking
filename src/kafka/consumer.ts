import { Kafka, Consumer, KafkaConfig, ConsumerConfig } from 'kafkajs';
import { TLogger } from '../types';
import { KafkaMember } from './member';

export abstract class KafkaConsumer extends KafkaMember <Consumer> {
  private topicsToSubscribe: Set<string>;

  public constructor (logger: TLogger = console) {
    super('KafkaConsumer', logger);
    this.topicsToSubscribe = new Set();
  }

  public async subscribe (topics: string | string[]): Promise<void> {
    this.topicsToSubscribe = new Set([
      ...this.topicsToSubscribe,
      ...(Array.isArray(topics) ? topics : [topics]),
    ]);

    await this.ready();
  }

  private async tryToSubscribe (): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.subscribe({
      topics: Array.from(this.topicsToSubscribe),
      fromBeginning: false,
    });

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

    this.logger.info(`${this.memberName}: subscribed`, Array.from(this.topicsToSubscribe));
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
      await this.tryToSubscribe();
    } catch (error) {
      this.setStatus('disconnected');
      throw error;
    }
  }

  private async init (): Promise<void> {
    const config = await this.getConfig();
    const consumerConfig = await this.getConsumerConfig();

    this.logger.info(`${this.memberName}: init kafka consumer`, {
      config,
      consumerConfig,
    });

    const kafka = new Kafka({
      ...config,
      retry: {
        restartOnFailure: async () => false,
      },
    });

    this.client = kafka.consumer(consumerConfig);

    this.client.on('consumer.crash', async () => {
      this.afterDisconnect();

      if (!this.manualDisconnect) {
        await this.ready();
      }
    });
  }

  abstract getConfig(): Promise<KafkaConfig>;
  abstract getConsumerConfig(): Promise<ConsumerConfig>;
  abstract onMessage (topic: string, data: Buffer | null): Promise<void>;
}
