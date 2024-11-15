# @orwoods/networking

![npm version](https://img.shields.io/npm/v/@orwoods/networking)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/npm/l/@orwoods/networking)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

## 📋 Overview

**@orwoods/networking** is a lightweight npm library designed for rapid and seamless setup of clients and servers for Kafka and gRPC in Node.js. It includes one-command generation of build files from `.proto` files, with full TypeScript support for streamlined development.

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

## ✨ gRPC usage Example
Here's a quick example to get you started:

### 1. Place the `*.proto` files in the `src/proto` folder
...or whatever folder you specified in the build-grpc command

### 2. Generating TypeScript files
Run:
```bash
npm run build-grpc
```

### 3. Setting up a gRPC Server
Create a file named `src/server.ts`:
```typescript
import { GrpcServer } from '@orwoods/networking';
import { IOrdersServer, OrdersService } from './grpc/generated/ordersService_grpc_pb';
import { GetOrderResponse } from './grpc/generated/ordersService_pb';

export class Server extends GrpcServer <IOrdersServer> {
  public async init () {
    this.registerMethods({
      getOrder: (call, callback) => {
        console.log(new Date(), 'Request from the client:', {
          id: call.request.getId(),
        });

        const order = new GetOrderResponse();
        order.setStatus('finished');

        callback(null, order);
      },
    });

    await super.init(OrdersService);
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

### 4. Setting up a gRPC Client
Create a file named `src/client.ts`:
```typescript
import { promisify } from 'util';
import { GrpcClient } from '@orwoods/networking';
import { OrdersClient } from './grpc/generated/ordersService_grpc_pb';
import { GetOrderResponse, GetOrderRequest } from './grpc/generated/ordersService_pb';

export class Client extends GrpcClient <OrdersClient> {
  private getOrderFn!: (_args: GetOrderRequest) => Promise<GetOrderResponse>;

  public async init () {
    await super.init(OrdersClient);

    this.getOrderFn = promisify(this.client.getOrder.bind(this.client));
  }

  public async getOrder (request: GetOrderRequest): Promise<GetOrderResponse> {
    return this.makeRequest(async () => this.getOrderFn(request), () => {
      throw new Error('getOrder error');
    });
  }

  public async getProps () {
    return {
      host: '127.0.0.1',
      port: 55306,
      tls: false,
      timeoutMs: 5000,
    };
  }
}
```

### 5. Running the Server
Create a file named `src/test_server.ts`:
```typescript
import { Server } from './server';

(async () => {
  const server = new Server();
  await server.init();
})();
```

To start the server, run:
```bash
ts-node src/test_server.ts
```

### 5. Running the Client
Create a file named `src/test_client.ts`:
```typescript
import { Client } from './client';
import { GetOrderRequest } from './grpc/generated/ordersService_pb';

(async () => {
  const client = new Client();
  await client.init();

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

### 6. Expected Output
When you run both the server and the client, you should see the following output in your terminal:
```javascript
2024-11-15T17:56:33.808Z Request from the client: { id: 'example-id' }
...
2024-11-15T17:56:33.809Z Response from the server: { id: 'example-id', status: 'finished' }
```

## ⚖️ License
This project is licensed under the MIT License - see the LICENSE file for details.
