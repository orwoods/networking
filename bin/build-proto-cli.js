#!/usr/bin/env node

const { resolve } = require('path');
const { execSync } = require('child_process');

const cwd = resolve(__dirname, '..');
const protoDir = process.argv[2] || 'src/proto';

execSync(`PROTO_DIR=${protoDir} npm run build-proto`, { cwd, stdio: 'inherit' });
