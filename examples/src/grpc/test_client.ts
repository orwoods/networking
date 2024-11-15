import { Client } from './client';
import { GetOrderRequest } from '../proto/generated/ordersService_pb';

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
