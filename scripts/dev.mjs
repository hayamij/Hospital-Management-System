import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm' : 'npm';
const useShell = process.platform === 'win32';
const childProcesses = [];
let shuttingDown = false;

const startProcess = (args) => {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: useShell,
  });
  childProcesses.push(child);
  return child;
};

const shutdown = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of childProcesses) {
    if (child.exitCode === null && !child.killed) {
      child.kill(signal);
    }
  }
};

const api = startProcess(['run', 'dev:api']);
const web = startProcess(['run', 'dev:web']);

const handleExit = (code) => {
  if (code && code !== 0) {
    shutdown();
    process.exit(code);
  }
};

api.on('exit', handleExit);
web.on('exit', handleExit);

process.on('SIGINT', () => {
  shutdown('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
  process.exit(0);
});
