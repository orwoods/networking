import { Kafka, Producer, Partitioners, KafkaConfig, ProducerConfig, Message as OrigKafkaMessage } from 'kafkajs';
import { TLogger, KafkaProducerRecord } from '../types';
import { wait } from '../utils';
import { KafkaMember } from './member';

export abstract class KafkaProducer extends KafkaMember <Producer> {
  private queue: KafkaProducerRecord[] = [];

  public constructor (logger: TLogger = console) {
    super('KafkaProducer', logger);
  }

  public async send (record: KafkaProducerRecord): Promise<boolean> {
    const messages = (Array.isArray(record.messages) ? record.messages : [record.messages]).map((message) => {
      if (!message.value && message.object) {
        message.value = Buffer.from(message.object.serializeBinary());
        delete message.object;
      }

      return message;
    }) as OrigKafkaMessage[];

    try {
      await this.ready();

      if (!this.client) {
        throw new Error('Disconnected');
      }

      await this.client.send({
        acks: 1,
        ...record,
        messages,
      });

      return true;
    } catch (e) {
      this.logger.error(`${this.memberName}: sending error`, record, e);
      this.queue.push(record);

      if (this.connected) {
        this.afterDisconnect();
        this.ready();
      }
    }

    this.errorsCounter++;

    return false;
  }

  // @no throw
  public async ready (): Promise<void> {
    if (this.connected) {
      return;
    }

    this.logger.info(`${this.memberName}: trying to connect`);

    try {
      if (!this.client) {
        await this.init();
      }
    } catch (err) {
      this.logger.error(`${this.memberName}: connection error`, err);

      this.afterDisconnect();

      setTimeout(() => {
        this.ready();
      }, 10 * 1000);

      return;
    }

    if (this.disconnected) {
      try {
        await this.start();
      } catch (err) {
        this.logger.error(`${this.memberName}: connection error`, err);

        this.afterDisconnect();

        setTimeout(() => {
          this.ready();
        }, 10 * 1000);

        return;
      }
    }

    try {
      for (let i = 0; i < 100; i++) {
        if (this.connected) {
          while (this.queue.length > 0) {
            const record = this.queue.shift();
            if (!record) {
              continue;
            }

            this.send(record).catch((err) => {
              this.logger.error(`${this.memberName}: sending error`, record, err);
            });
          }

          return;
        }

        if (this.disconnected) {
          throw new Error('Disconnect occurred in the ready method');
        }

        await wait(100);
      }

      throw new Error('Time is out in the ready method');
    } catch (err) {
      this.logger.error(`${this.memberName}: connection error`, err);

      this.afterDisconnect();

      setTimeout(() => {
        this.ready();
      }, 10 * 1000);
    }
  }

  private async init () {
    const config = await this.getConfig();

    if (config.brokers.length === 0) {
      throw new Error('No Kafka brokers available');
    }

    const producerConfig = await this.getProducerConfig();

    this.logger.info(`${this.memberName}: init kafka producer`, {
      config,
      producerConfig,
    });

    const kafka = new Kafka({
      ...config,
      retry: {
        restartOnFailure: async () => false,
      },
    });

    this.client = kafka.producer(producerConfig);
  }

  private async start (): Promise<void> {
    this.setStatus('connecting');

    this.logger.info(`${this.memberName}: start`);

    try {
      if (!this.client) {
        throw new Error(`${this.memberName}: uninitialized kafka client`);
      }

      await this.client.connect();

      this.setStatus('connected');
    } catch (error) {
      this.logger.error(`${this.memberName}: start error`, error);

      this.setStatus('disconnected');

      throw error;
    }
  }

  public async getProducerConfig(): Promise<ProducerConfig> {
    return {
      createPartitioner: Partitioners.DefaultPartitioner,
    };
  }

  abstract getConfig(): Promise<KafkaConfig>;
}
