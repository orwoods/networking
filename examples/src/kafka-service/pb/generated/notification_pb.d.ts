// package: notifications
// file: notification.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Notification extends jspb.Message { 
    getSubject(): string;
    setSubject(value: string): Notification;
    getBody(): string;
    setBody(value: string): Notification;

    hasUrl(): boolean;
    clearUrl(): void;
    getUrl(): string | undefined;
    setUrl(value: string): Notification;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Notification.AsObject;
    static toObject(includeInstance: boolean, msg: Notification): Notification.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Notification, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Notification;
    static deserializeBinaryFromReader(message: Notification, reader: jspb.BinaryReader): Notification;
}

export namespace Notification {
    export type AsObject = {
        subject: string,
        body: string,
        url?: string,
    }
}
