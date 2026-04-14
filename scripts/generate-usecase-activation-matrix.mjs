import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const USECASE_DIR = path.join(ROOT, 'server', 'application', 'use-cases');
const TARGET_DIRS = [
  path.join(ROOT, 'server', 'infrastructure', 'http'),
  path.join(ROOT, 'server', 'adapters', 'controllers', 'http'),
];
const OUTPUT_FILE = path.join(ROOT, '.docs', 'usecase-activation-matrix.auto.md');

const toPosix = (value) => value.split(path.sep).join('/');

const escapeMdCell = (value) =>
  String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');

async function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function collectUseCases() {
  const allFiles = await walkFiles(USECASE_DIR);
  const useCaseFiles = allFiles.filter((filePath) => filePath.endsWith('.usecase.js'));

  const entries = [];
  for (const filePath of useCaseFiles) {
    const source = await fs.readFile(filePath, 'utf8');
    const classMatch = /export\s+class\s+([A-Za-z_$][\w$]*)/.exec(source);
    if (!classMatch) continue;

    entries.push({
      className: classMatch[1],
      filePath: toPosix(path.relative(ROOT, filePath)),
    });
  }

  return entries.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

async function collectTargetSources() {
  const allFiles = [];

  for (const dir of TARGET_DIRS) {
    const files = await walkFiles(dir);
    allFiles.push(...files.filter((filePath) => filePath.endsWith('.js')));
  }

  const uniqueFiles = [...new Set(allFiles)];
  const sources = [];
  for (const filePath of uniqueFiles) {
    sources.push({
      filePath,
      relativePath: toPosix(path.relative(ROOT, filePath)),
      content: await fs.readFile(filePath, 'utf8'),
    });
  }

  return sources;
}

function buildReport({ useCases, targetSources }) {
  const rows = useCases.map((entry) => {
    const pattern = new RegExp(`\\b${escapeRegExp(entry.className)}\\b`);
    const references = targetSources
      .filter((target) => pattern.test(target.content))
      .map((target) => target.relativePath)
      .sort();

    const status = references.length > 0 ? 'WIRED' : 'UNWIRED';

    return {
      ...entry,
      references,
      status,
    };
  });

  rows.sort((a, b) => {
    const statusRank = { UNWIRED: 0, WIRED: 1 };
    const diff = statusRank[a.status] - statusRank[b.status];
    if (diff !== 0) return diff;
    return a.filePath.localeCompare(b.filePath);
  });

  const summary = {
    total: rows.length,
    wired: rows.filter((row) => row.status === 'WIRED').length,
    unwired: rows.filter((row) => row.status === 'UNWIRED').length,
  };

  const lines = [];
  lines.push('# Use Case Activation Matrix (Auto)');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total use case classes: ${summary.total}`);
  lines.push(`- WIRED (referenced in HTTP wiring/controller layer): ${summary.wired}`);
  lines.push(`- UNWIRED: ${summary.unwired}`);
  lines.push('');
  lines.push('## Matrix');
  lines.push('');
  lines.push('| Use Case Class | File | Wiring References | Status |');
  lines.push('|---|---|---|---|');

  for (const row of rows) {
    const refs = row.references.length ? row.references.join('<br>') : '-';
    lines.push(
      `| ${escapeMdCell(row.className)} | ${escapeMdCell(row.filePath)} | ${escapeMdCell(refs)} | ${escapeMdCell(row.status)} |`
    );
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- WIRED means class name is referenced in `server/infrastructure/http` or `server/adapters/controllers/http`.');
  lines.push('- Route-level UI activity should be verified together with `.docs/route-vs-frontend-matrix.auto.md`.');

  return lines.join('\n');
}

async function main() {
  const [useCases, targetSources] = await Promise.all([
    collectUseCases(),
    collectTargetSources(),
  ]);

  const report = buildReport({ useCases, targetSources });
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, report, 'utf8');

  console.log(`Use case activation matrix generated: ${toPosix(path.relative(ROOT, OUTPUT_FILE))}`);
}

main().catch((error) => {
  console.error('Failed to generate use case activation matrix report.');
  console.error(error);
  process.exitCode = 1;
});
