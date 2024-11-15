// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var ordersService_pb = require('./ordersService_pb.js');

function serialize_orders_service_api_GetOrderRequest(arg) {
  if (!(arg instanceof ordersService_pb.GetOrderRequest)) {
    throw new Error('Expected argument of type orders_service_api.GetOrderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_orders_service_api_GetOrderRequest(buffer_arg) {
  return ordersService_pb.GetOrderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_orders_service_api_GetOrderResponse(arg) {
  if (!(arg instanceof ordersService_pb.GetOrderResponse)) {
    throw new Error('Expected argument of type orders_service_api.GetOrderResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_orders_service_api_GetOrderResponse(buffer_arg) {
  return ordersService_pb.GetOrderResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var OrdersService = exports.OrdersService = {
  getOrder: {
    path: '/orders_service_api.Orders/GetOrder',
    requestStream: false,
    responseStream: false,
    requestType: ordersService_pb.GetOrderRequest,
    responseType: ordersService_pb.GetOrderResponse,
    requestSerialize: serialize_orders_service_api_GetOrderRequest,
    requestDeserialize: deserialize_orders_service_api_GetOrderRequest,
    responseSerialize: serialize_orders_service_api_GetOrderResponse,
    responseDeserialize: deserialize_orders_service_api_GetOrderResponse,
  },
};

exports.OrdersClient = grpc.makeGenericClientConstructor(OrdersService, 'Service');
