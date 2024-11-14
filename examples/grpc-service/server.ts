import { GrpcServer } from '@orwoods/networking';
import { OrdersService } from './grpc/generated/ordersService_grpc_pb';
import { GetOrderResponse } from './grpc/generated/ordersService_pb';

export class Server extends GrpcServer {
  public async init () {
    await super.init(OrdersService);
  }

  public async getProps () {
    return Promise.resolve({
      host: '127.0.0.1',
      port: 55306,
      tls: false,
    });
  }

  protected getImplementation () {
    return {
      getOrder: (call, callback) => {
        const order = new GetOrderResponse();
        order.setStatus('finished');

        callback(null, order);
      },
    };
  }
}
