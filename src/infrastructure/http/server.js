import { startServer } from '../../../index.js';
import { createRealDeps } from './realDeps.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Bootstraps an HTTP server wired to real MSSQL-backed dependencies.
export async function startHttpServer({ port = process.env.PORT || 3000 } = {}) {
  const deps = createRealDeps();
  const { server } = await startServer(deps, { port });
  console.log(`HTTP server listening on port ${port}`);
  return server;
}

// Allow `node src/infrastructure/http/server.js`
const thisFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedPath && thisFilePath === invokedPath) {
  startHttpServer();
}
