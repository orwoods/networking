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
