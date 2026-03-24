import { startServer } from '../../../index.js';
import { createMockDeps } from './mockDeps.js';
import { createRealDeps } from './realDeps.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Bootstraps an HTTP server with mock dependencies so the frontend can exercise
// all adapter routes without a database. Set USE_MOCK=false to use real SQLite
// repositories and simple use cases.
export async function startHttpServer({ port = process.env.PORT || 3000 } = {}) {
  const useMock = String(process.env.USE_MOCK ?? 'true').toLowerCase() === 'true';
  const deps = useMock ? createMockDeps() : createRealDeps();
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
