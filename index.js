import express from 'express';
import { createHttpRouter } from './server/adapters/controllers/http/routerFactory.js';

// Build an Express app wired with HTTP controllers. The caller must provide all
// use-case instances in deps (e.g., scheduleAppointmentUseCase, adminLoginUseCase).
export function buildApp(deps) {
  const app = express();
  app.use(express.json());
  app.use('/api', createHttpRouter(deps));
  return app;
}

// Optional helper to start the HTTP server. This stays thin so future hosting
// choices (serverless adapters, different ports, etc.) can reuse buildApp.
export function startServer(deps, { port = process.env.PORT || 3000 } = {}) {
  const app = buildApp(deps);
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve({ app, server, port }));
  });
}

export default { buildApp, startServer };
