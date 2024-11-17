# @orwoods/networking

![npm version](https://img.shields.io/npm/v/@orwoods/networking)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/npm/l/@orwoods/networking)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

## 📋 Overview

A lightweight npm library designed for rapid and seamless setup of gRPC clients/servers and Kafka consumers/producers in Node.js. It includes a single command for generating build files from `.proto` files with full TypeScript support to simplify development.

Demo project: [https://github.com/orwoods/networking-example](https://github.com/orwoods/networking-example)

## 🚀 Features

- 🌐 **Easy gRPC Setup**: Effortlessly set up both gRPC clients and servers.
- 🌐 **Easy Kafka Setup**: Effortlessly set up both Kafka clients and servers.
- ⚙️ **Proto Compilation**: One-command generation of TypeScript classes from `.proto` files.
- 🛠 **TypeScript Support**: Full TypeScript support for type-safe development.
- 📦 **Zero Configuration**: Minimal configuration needed to get started.

## 📦 Installation

In the command below, if necessary, specify the correct path to the proto files

```bash
npm install @orwoods/networking

jq '.scripts["build-proto"] = "./node_modules/.bin/build-proto-cli src/proto"' package.json > tmp.json && mv tmp.json package.json
```

## 🛠️ Compilation of Protobuf files

### 1. Place the `*.proto` files in the `src/proto` folder
...or whatever folder you specified in the build-proto command

### 2. Run command to compile to JS and TS
```bash
npm run build-proto
```
or just
```bash
./node_modules/.bin/build-proto-cli src/proto
```

## 💻 Kafka usage Example
Here's a quick example to get you started:

### 1. Setting up a Kafka Producer
Create a file named `src/producer.ts`:
```typescript
import { KafkaProducer, KafkaConfig } from '@orwoods/networking';

export class Producer extends KafkaProducer {
  public async getConfig(): Promise<KafkaConfig> {
    return {
      brokers: ['127.0.0.1:9092'],
    };
  }
}
```

### 2. Setting up a Kafka Consumer
Create a file named `src/consumer.ts`:
```typescript
import { KafkaConfig, KafkaConsumer, ConsumerConfig } from '@orwoods/networking';
import { Notification } from '../proto/generated/notification_pb';

export class Consumer extends KafkaConsumer {
  public async getConfig(): Promise<KafkaConfig> {
    return {
      clientId: 'example-consumer-app',
      brokers: ['127.0.0.1:9092'],
    };
  }

  public async getConsumerConfig(): Promise<ConsumerConfig> {
    return {
      groupId: 'example-group-id',
    };
  }

  public async onMessage(topic: string, data: Buffer): Promise<void> {
    const notification = Notification.deserializeBinary(data);

    console.warn('New message', {
      topic,
      subject: notification.getSubject(),
      body: notification.getBody(),
      url: notification.getUrl(),
    });
  }
}
```

### 3. Running
Create a file named `src/test_kafka.ts`:
```typescript
import { Consumer } from './kafka/listener';
import { Producer } from './kafka/producer';
import { Notification } from './proto/generated/notification_pb';

(async () => {
  const consumer = new Consumer();
  const producer = new Producer();

  await consumer.subscribe(['example']);

  const object = new Notification();
  object.setSubject('Hello');
  object.setBody('World');
  object.setUrl('http://127.0.0.1');

  await producer.send({
    topic: 'example',
    acks: 1,
    messages: [{ object }],
  });
})();
```

## 💻 gRPC usage Example
Here's a quick example to get you started:

### 1. Setting up a gRPC Server
Create a file named `src/server.ts`:
```typescript
import { GrpcServer } from '@orwoods/networking';
import { IOrdersServer, IOrdersService, OrdersService } from '../proto/generated/ordersService_grpc_pb';
import { GetOrderResponse } from '../proto/generated/ordersService_pb';

export class Server extends GrpcServer <IOrdersServer, IOrdersService> {
  public constructor () {
    super(OrdersService, {
      getOrder: (call, callback) => {
        console.warn(new Date(), 'Request from the client:', {
          id: call.request.getId(),
        });

        const order = new GetOrderResponse();
        order.setStatus('finished');

        callback(null, order);
      },
    });
  }

  public async getProps () {
    return Promise.resolve({
      host: '127.0.0.1',
      port: 55306,
      tls: false,
    });
  }
}
```

### 2. Setting up a gRPC Client
Create a file named `src/client.ts`:
```typescript
import { promisify } from 'util';
import { GrpcClient } from '@orwoods/networking';
import { OrdersClient } from './grpc/generated/ordersService_grpc_pb';
import { GetOrderResponse, GetOrderRequest } from './grpc/generated/ordersService_pb';

export class Client extends GrpcClient <OrdersClient> {
  private getOrderFn!: (_args: GetOrderRequest) => Promise<GetOrderResponse>;

  constructor () {
    super(OrdersClient);
  }

  protected onInit () {
    this.getOrderFn = promisify(this.client.getOrder.bind(this.client));
  }

  public async getOrder (request: GetOrderRequest): Promise<GetOrderResponse | null> {
    return this.makeRequest(async () => this.getOrderFn(request), () => null);
  }

  public async getProps () {
    return {
      host: '127.0.0.1',
      port: 55306,
      tls: false,
      requestTimeoutMs: 60000,
      connectionTimeoutMs: 10000,
      reconnectionDelayMs: 1000,
      maxReconnectionAttempts: 50,
      grpcStatusesForReconnect: [
        grpc.status.UNAVAILABLE,
        grpc.status.DEADLINE_EXCEEDED,
        grpc.status.INTERNAL,
        grpc.status.RESOURCE_EXHAUSTED,
        grpc.status.UNKNOWN,
        grpc.status.DATA_LOSS,
      ],
    };
  }
}
```

### 3. Running the Server
Create a file named `src/test_server.ts`:
```typescript
import { Server } from './server';

(async () => {
  const server = new Server();
  await server.start();
})();
```

To start the server, run:
```bash
ts-node src/test_server.ts
```

### 4. Running the Client
Create a file named `src/test_client.ts`:
```typescript
import { Client } from './client';
import { GetOrderRequest } from './grpc/generated/ordersService_pb';

(async () => {
  const client = new Client();
  await client.connect();

  setInterval(async () => {
    const request = new GetOrderRequest();
    request.setId('example-id');

    try {
      const order = await client.getOrder(request);

      console.log(new Date(), 'Response from the server:', {
        id: request.getId(),
        status: order.getStatus(),
      });
    } catch (error) {
      console.error(error);
    }
  }, 1000);
})();
```

To start the client, run:
```bash
ts-node src/test_client.ts
```

### 5. Expected Output
When you run both the server and the client, you should see the following output in your terminal:
```javascript
2024-11-15T17:56:33.808Z Request from the client: { id: 'example-id' }
...
2024-11-15T17:56:33.809Z Response from the server: { id: 'example-id', status: 'finished' }
```

## ⚖️ License
This project is licensed under the MIT License - see the LICENSE file for details.
