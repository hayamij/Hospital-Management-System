import { startServer } from '../../index.js';
import { createMockDeps } from './mockDeps.js';

// Bootstraps an HTTP server with mock dependencies so the frontend can exercise
// all adapter routes without a database. Swap createMockDeps with real DI when
// infrastructure is ready.
export async function startHttpServer({ port = process.env.PORT || 3000 } = {}) {
  const deps = createMockDeps();
  const { server } = await startServer(deps, { port });
  console.log(`HTTP server listening on port ${port}`);
  return server;
}

// Allow `node src/infrastructure/http/server.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  startHttpServer();
}
