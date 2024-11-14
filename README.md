# networking

### Environment

Key | Description
------------ | -------------
**NODE_ENV** | [optional] TODO. Default: `development`

### Installation (gRPC)

##### Step 1.
Put your proto files in src/grpc or any other folder

##### Step 2.
In the command below, if necessary, specify the correct path to the proto files, then run the command
```shell
yarn add @orwoods/networking && jq '.scripts["build-grpc"] = "./node_modules/.bin/build-grpc-cli src/grpc"' package.json > tmp.json && mv tmp.json package.json && yarn build-grpc
```

##### Step 3.
Generate your gRPC files
```shell
yarn build-grpc
```

##### Step 4.
> write the code (below is an example)

### Client example
TODO

### How to use it
TODO

Output:
TODO

### Server example
TODO

### How to use it
TODO
