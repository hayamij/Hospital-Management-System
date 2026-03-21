import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Run every *.test.js under the test folder
    include: ['test/**/*.test.js'],
  },
  resolve: {
    alias: {
      legacyTestHarness: path.resolve(__dirname, './legacyTestHarness.js'),
    },
  },
});
