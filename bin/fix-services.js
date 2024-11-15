/**
 * This fix is ​​needed because there was a bug in the grpc-js library.
 * I sent a Pull Request to its creator and it was accepted and merged,
 * but the release with the new version of the binary has not been released yet.
 *
 * As soon as the creator makes a new release, this fix can be removed.
 * And here is this fix:
 *
 * https://github.com/grpc/grpc-node/commit/6a4e2dba98963ccdc9d359d90f0604e5bcef87d1
 */

const fs = require('fs');
const path = require('path');

function replaceInFile (filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    const regex = /grpc\.makeGenericClientConstructor\((\w+)\)/g;

    const newContent = content.replace(regex, (match, serviceName) => {
      return `grpc.makeGenericClientConstructor(${serviceName}, '${serviceName}')`;
    });

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } catch (err) {
    console.error(filePath, err);
  }
}

export function findAndReplaceInDir (dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findAndReplaceInDir(filePath);
    } else if (file.endsWith('grpc_pb.js')) {
      replaceInFile(filePath);
    }
  });
}
