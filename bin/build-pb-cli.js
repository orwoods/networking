#!/usr/bin/env node

const { resolve } = require('path');
const { execSync } = require('child_process');

const cwd = resolve(__dirname, '..');
const grpcDir = process.argv[2] || 'src/pb';

execSync(`PB_DIR=${grpcDir} npm run build-pb`, { cwd, stdio: 'inherit' });
