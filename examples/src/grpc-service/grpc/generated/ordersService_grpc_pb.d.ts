// package: orders_service_api
// file: ordersService.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as ordersService_pb from "./ordersService_pb";

interface IOrdersService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    getOrder: IOrdersService_IGetOrder;
}

interface IOrdersService_IGetOrder extends grpc.MethodDefinition<ordersService_pb.GetOrderRequest, ordersService_pb.GetOrderResponse> {
    path: "/orders_service_api.Orders/GetOrder";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<ordersService_pb.GetOrderRequest>;
    requestDeserialize: grpc.deserialize<ordersService_pb.GetOrderRequest>;
    responseSerialize: grpc.serialize<ordersService_pb.GetOrderResponse>;
    responseDeserialize: grpc.deserialize<ordersService_pb.GetOrderResponse>;
}

export const OrdersService: IOrdersService;

export interface IOrdersServer extends grpc.UntypedServiceImplementation {
    getOrder: grpc.handleUnaryCall<ordersService_pb.GetOrderRequest, ordersService_pb.GetOrderResponse>;
}

export interface IOrdersClient {
    getOrder(request: ordersService_pb.GetOrderRequest, callback: (error: grpc.ServiceError | null, response: ordersService_pb.GetOrderResponse) => void): grpc.ClientUnaryCall;
    getOrder(request: ordersService_pb.GetOrderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ordersService_pb.GetOrderResponse) => void): grpc.ClientUnaryCall;
    getOrder(request: ordersService_pb.GetOrderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ordersService_pb.GetOrderResponse) => void): grpc.ClientUnaryCall;
}

export class OrdersClient extends grpc.Client implements IOrdersClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public getOrder(request: ordersService_pb.GetOrderRequest, callback: (error: grpc.ServiceError | null, response: ordersService_pb.GetOrderResponse) => void): grpc.ClientUnaryCall;
    public getOrder(request: ordersService_pb.GetOrderRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: ordersService_pb.GetOrderResponse) => void): grpc.ClientUnaryCall;
    public getOrder(request: ordersService_pb.GetOrderRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: ordersService_pb.GetOrderResponse) => void): grpc.ClientUnaryCall;
}
