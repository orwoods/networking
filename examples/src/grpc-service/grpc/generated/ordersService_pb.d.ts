// package: orders_service_api
// file: ordersService.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class GetOrderRequest extends jspb.Message { 
    getId(): string;
    setId(value: string): GetOrderRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetOrderRequest.AsObject;
    static toObject(includeInstance: boolean, msg: GetOrderRequest): GetOrderRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetOrderRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetOrderRequest;
    static deserializeBinaryFromReader(message: GetOrderRequest, reader: jspb.BinaryReader): GetOrderRequest;
}

export namespace GetOrderRequest {
    export type AsObject = {
        id: string,
    }
}

export class GetOrderResponse extends jspb.Message { 
    getStatus(): string;
    setStatus(value: string): GetOrderResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GetOrderResponse.AsObject;
    static toObject(includeInstance: boolean, msg: GetOrderResponse): GetOrderResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GetOrderResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GetOrderResponse;
    static deserializeBinaryFromReader(message: GetOrderResponse, reader: jspb.BinaryReader): GetOrderResponse;
}

export namespace GetOrderResponse {
    export type AsObject = {
        status: string,
    }
}
