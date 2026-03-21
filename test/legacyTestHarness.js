import { test } from 'vitest';

export function wrapLegacyRun(runFn, name = 'legacy') {
  test(name, async () => {
    await runFn();
  });
}
