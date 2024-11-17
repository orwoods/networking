import type { Message as GoogleMessage } from 'google-protobuf';
import type {
  Message as OrigKafkaMessage,
  ProducerRecord as OrigKafkaProducerRecord,
  KafkaConfig,
  ConsumerConfig,
  ProducerConfig,
} from 'kafkajs';

export type TLogger = {
  info: (...args: any[]) => any;
  error: (...args: any[]) => any;
  warn: (...args: any[]) => any;
  debug: (...args: any[]) => any;
};

export type KafkaMessage = Omit<OrigKafkaMessage, 'value'> & {
  object?: GoogleMessage;
  value?: OrigKafkaMessage['value'];
};

export type KafkaProducerRecord = Omit<OrigKafkaProducerRecord, 'messages'> & {
  messages: KafkaMessage[]
};

export type KafkaConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export { KafkaConfig };
export { ConsumerConfig };
export { ProducerConfig };
