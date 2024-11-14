#!/usr/bin/env node

const { resolve } = require('path');
const { execSync } = require('child_process');

const cwd = resolve(__dirname, '..');
const grpcDir = process.argv[2] || 'src/grpc';

execSync(`GRPC_DIR=${grpcDir} yarn build-grpc`, { cwd, stdio: 'inherit' });
