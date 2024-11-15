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
