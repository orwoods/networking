import { Client } from './client';

(async () => {
  const client = new Client();
  await client.init();

  const request = new GetOrderRequest();
  request.setId('example-id');

  const order = await client.getOrder(request);
  if (!order) {
    throw new Error('Unknown order');
  }

  console.log({
    id: request.getId(),
    status: order.getStatus(),
  });
})();
