import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ROUTER_FILE = path.join(
  ROOT,
  'server',
  'adapters',
  'controllers',
  'http',
  'routerFactory.js'
);
const API_FILE = path.join(ROOT, 'client', 'src', 'services', 'api.js');
const CLIENT_SRC_DIR = path.join(ROOT, 'client', 'src');
const OUTPUT_FILE = path.join(ROOT, '.docs', 'route-vs-frontend-matrix.auto.md');

const toPosixPath = (value) => value.split(path.sep).join('/');

const escapeMdCell = (value) =>
  String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');

const isIdentifierStart = (ch) => /[A-Za-z_$]/.test(ch || '');
const isIdentifierPart = (ch) => /[A-Za-z0-9_$]/.test(ch || '');

const createKey = (method, canonicalPath) => `${method.toUpperCase()} ${canonicalPath}`;

function findMatchingToken(source, openIndex, openToken, closeToken) {
  let depth = 1;
  let mode = 'normal';

  for (let i = openIndex + 1; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (mode === 'line_comment') {
      if (ch === '\n') mode = 'normal';
      continue;
    }

    if (mode === 'block_comment') {
      if (ch === '*' && next === '/') {
        mode = 'normal';
        i += 1;
      }
      continue;
    }

    if (mode === 'single_quote') {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === "'") mode = 'normal';
      continue;
    }

    if (mode === 'double_quote') {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === '"') mode = 'normal';
      continue;
    }

    if (mode === 'template') {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === '`') mode = 'normal';
      continue;
    }

    if (ch === '/' && next === '/') {
      mode = 'line_comment';
      i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      mode = 'block_comment';
      i += 1;
      continue;
    }

    if (ch === "'") {
      mode = 'single_quote';
      continue;
    }

    if (ch === '"') {
      mode = 'double_quote';
      continue;
    }

    if (ch === '`') {
      mode = 'template';
      continue;
    }

    if (ch === openToken) {
      depth += 1;
      continue;
    }

    if (ch === closeToken) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function canonicalizePath(rawPath) {
  if (!rawPath) return null;

  let normalized = String(rawPath).trim();
  const queryPos = normalized.indexOf('?');
  if (queryPos !== -1) normalized = normalized.slice(0, queryPos);

  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (!normalized.startsWith('/api/')) normalized = `/api${normalized}`;

  const segments = normalized
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (!segment) return segment;
      if (segment.startsWith(':')) return ':param';
      if (segment.includes('${')) return ':param';
      if (segment === '*') return ':param';
      return segment;
    });

  return `/${segments.join('/')}`;
}

function parseBackendRoutes(source) {
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*'([^']+)'/g;
  const routes = [];

  let match = routeRegex.exec(source);
  while (match) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const fullPath = routePath.startsWith('/api/') ? routePath : `/api${routePath}`;

    routes.push({
      method,
      routePath,
      fullPath,
      canonicalPath: canonicalizePath(fullPath),
    });

    match = routeRegex.exec(source);
  }

  return routes;
}

function parseRequestFromMethodBody(methodBody) {
  const requestIdx = methodBody.indexOf('request(');
  if (requestIdx === -1) return null;

  const openParen = methodBody.indexOf('(', requestIdx);
  if (openParen === -1) return null;

  const closeParen = findMatchingToken(methodBody, openParen, '(', ')');
  if (closeParen === -1) return null;

  const argsSource = methodBody.slice(openParen + 1, closeParen);
  const pathMatch = /^\s*([`'\"])([\s\S]*?)\1/.exec(argsSource);
  if (!pathMatch) return null;

  const pathRaw = pathMatch[2].trim();
  const methodMatch = /method\s*:\s*['\"]([A-Za-z]+)['\"]/.exec(argsSource);
  const method = (methodMatch?.[1] || 'GET').toUpperCase();

  return { method, pathRaw };
}

function parseMethodsFromApiObject(apiName, objectBody) {
  const methods = [];
  let idx = 0;

  while (idx < objectBody.length) {
    while (idx < objectBody.length && /[\s,]/.test(objectBody[idx])) idx += 1;
    if (idx >= objectBody.length) break;

    if (!isIdentifierStart(objectBody[idx])) {
      idx += 1;
      continue;
    }

    let nameEnd = idx + 1;
    while (nameEnd < objectBody.length && isIdentifierPart(objectBody[nameEnd])) {
      nameEnd += 1;
    }

    const methodName = objectBody.slice(idx, nameEnd);
    let cursor = nameEnd;
    while (cursor < objectBody.length && /\s/.test(objectBody[cursor])) cursor += 1;

    if (objectBody[cursor] !== '(') {
      idx = nameEnd;
      continue;
    }

    const paramsEnd = findMatchingToken(objectBody, cursor, '(', ')');
    if (paramsEnd === -1) break;

    cursor = paramsEnd + 1;
    while (cursor < objectBody.length && /\s/.test(objectBody[cursor])) cursor += 1;

    if (objectBody[cursor] !== '{') {
      idx = cursor + 1;
      continue;
    }

    const bodyEnd = findMatchingToken(objectBody, cursor, '{', '}');
    if (bodyEnd === -1) break;

    const methodBody = objectBody.slice(cursor + 1, bodyEnd);
    const requestInfo = parseRequestFromMethodBody(methodBody);

    if (requestInfo) {
      methods.push({
        apiName,
        methodName,
        symbol: `${apiName}.${methodName}`,
        method: requestInfo.method,
        pathRaw: requestInfo.pathRaw,
        canonicalPath: canonicalizePath(requestInfo.pathRaw),
        usageCount: 0,
        usedBy: new Map(),
      });
    }

    idx = bodyEnd + 1;
  }

  return methods;
}

function parseFrontendApiRoutes(source) {
  const objectHeaderRegex = /export const\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  const methods = [];

  let match = objectHeaderRegex.exec(source);
  while (match) {
    const apiName = match[1];
    const openBraceIndex = match.index + match[0].lastIndexOf('{');
    const closeBraceIndex = findMatchingToken(source, openBraceIndex, '{', '}');
    if (closeBraceIndex === -1) {
      match = objectHeaderRegex.exec(source);
      continue;
    }

    const objectBody = source.slice(openBraceIndex + 1, closeBraceIndex);
    methods.push(...parseMethodsFromApiObject(apiName, objectBody));
    objectHeaderRegex.lastIndex = closeBraceIndex + 1;

    match = objectHeaderRegex.exec(source);
  }

  return methods;
}

async function walkFilesRecursive(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else {
        files.push(absolutePath);
      }
    }
  }

  return files;
}

async function collectFrontendUsages(frontendMethods) {
  const methodBySymbol = new Map(frontendMethods.map((method) => [method.symbol, method]));
  const callerPattern = /(authApi|patientApi|doctorApi|adminApi|guestApi)\.([A-Za-z_$][\w$]*)\s*\(/g;

  const files = await walkFilesRecursive(CLIENT_SRC_DIR);
  const targetFiles = files.filter((filePath) => {
    const rel = toPosixPath(path.relative(ROOT, filePath));
    if (rel === 'client/src/services/api.js') return false;
    return /\.(js|vue)$/.test(filePath);
  });

  for (const filePath of targetFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const perFileHits = new Map();

    let match = callerPattern.exec(content);
    while (match) {
      const symbol = `${match[1]}.${match[2]}`;
      if (methodBySymbol.has(symbol)) {
        perFileHits.set(symbol, (perFileHits.get(symbol) || 0) + 1);
      }
      match = callerPattern.exec(content);
    }

    const relativePath = toPosixPath(path.relative(ROOT, filePath));
    for (const [symbol, count] of perFileHits.entries()) {
      const targetMethod = methodBySymbol.get(symbol);
      targetMethod.usageCount += count;
      targetMethod.usedBy.set(relativePath, (targetMethod.usedBy.get(relativePath) || 0) + count);
    }
  }
}

function formatCallers(methods) {
  const merged = new Map();

  for (const method of methods) {
    for (const [filePath, count] of method.usedBy.entries()) {
      merged.set(filePath, (merged.get(filePath) || 0) + count);
    }
  }

  const ordered = [...merged.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([filePath, count]) => `${filePath} (${count})`);

  if (ordered.length === 0) return '-';
  const capped = ordered.slice(0, 6);
  if (ordered.length > capped.length) {
    capped.push(`+${ordered.length - capped.length} files`);
  }
  return capped.join('<br>');
}

function buildMarkdownReport({ backendRoutes, frontendMethods }) {
  const backendRouteKeys = new Set();
  const frontendByKey = new Map();

  for (const method of frontendMethods) {
    const key = createKey(method.method, method.canonicalPath);
    if (!frontendByKey.has(key)) {
      frontendByKey.set(key, []);
    }
    frontendByKey.get(key).push(method);
  }

  const sortedBackend = [...backendRoutes].sort((a, b) => {
    if (a.fullPath === b.fullPath) return a.method.localeCompare(b.method);
    return a.fullPath.localeCompare(b.fullPath);
  });

  const routeRows = [];
  let activeCount = 0;
  let uncalledCount = 0;
  let missingWrapperCount = 0;

  for (const route of sortedBackend) {
    const key = createKey(route.method, route.canonicalPath);
    backendRouteKeys.add(key);

    const mappedMethods = frontendByKey.get(key) || [];
    const usageCount = mappedMethods.reduce((sum, item) => sum + item.usageCount, 0);

    let status = 'NO_FRONTEND_WRAPPER';
    if (mappedMethods.length > 0 && usageCount > 0) {
      status = 'ACTIVE';
      activeCount += 1;
    } else if (mappedMethods.length > 0) {
      status = 'UNUSED_IN_UI';
      uncalledCount += 1;
    } else {
      missingWrapperCount += 1;
    }

    routeRows.push({
      method: route.method,
      path: route.fullPath,
      wrapper: mappedMethods.length > 0 ? mappedMethods.map((item) => item.symbol).join(', ') : '-',
      usageCount,
      callers: formatCallers(mappedMethods),
      status,
    });
  }

  const frontendNoBackend = frontendMethods
    .filter((method) => !backendRouteKeys.has(createKey(method.method, method.canonicalPath)))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const lines = [];
  lines.push('# Backend Route vs Frontend Call Matrix (Auto)');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total backend routes: ${routeRows.length}`);
  lines.push(`- Active routes (wired and called): ${activeCount}`);
  lines.push(`- Wired but not called in UI: ${uncalledCount}`);
  lines.push(`- Routes without frontend wrapper: ${missingWrapperCount}`);
  lines.push(`- Frontend wrappers without backend route: ${frontendNoBackend.length}`);
  lines.push('');
  lines.push('## Route Matrix');
  lines.push('');
  lines.push('| Method | Backend Route | Frontend Wrapper | UI Call Count | Caller Files | Status |');
  lines.push('|---|---|---|---:|---|---|');

  for (const row of routeRows) {
    lines.push(
      `| ${escapeMdCell(row.method)} | ${escapeMdCell(row.path)} | ${escapeMdCell(row.wrapper)} | ${row.usageCount} | ${escapeMdCell(row.callers)} | ${escapeMdCell(row.status)} |`
    );
  }

  lines.push('');
  lines.push('## Frontend Wrappers Without Backend Route');
  lines.push('');

  if (frontendNoBackend.length === 0) {
    lines.push('- None');
  } else {
    lines.push('| Wrapper | Method | Frontend Path | Canonical Key | Usage Count | Caller Files |');
    lines.push('|---|---|---|---|---:|---|');

    for (const method of frontendNoBackend) {
      lines.push(
        `| ${escapeMdCell(method.symbol)} | ${escapeMdCell(method.method)} | ${escapeMdCell(`/api${method.pathRaw.startsWith('/') ? method.pathRaw : `/${method.pathRaw}`}`)} | ${escapeMdCell(createKey(method.method, method.canonicalPath))} | ${method.usageCount} | ${escapeMdCell(formatCallers([method]))} |`
      );
    }
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Status ACTIVE means route has a frontend API wrapper and at least one detected call site in client source.');
  lines.push('- Status UNUSED_IN_UI means wrapper exists but no direct call detected in client source files.');
  lines.push('- Status NO_FRONTEND_WRAPPER means backend route currently has no matching wrapper in client API layer.');

  return lines.join('\n');
}

async function main() {
  const [routerSource, apiSource] = await Promise.all([
    fs.readFile(ROUTER_FILE, 'utf8'),
    fs.readFile(API_FILE, 'utf8'),
  ]);

  const backendRoutes = parseBackendRoutes(routerSource);
  const frontendMethods = parseFrontendApiRoutes(apiSource);
  await collectFrontendUsages(frontendMethods);

  const report = buildMarkdownReport({ backendRoutes, frontendMethods });
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, report, 'utf8');

  console.log(`Route matrix generated: ${toPosixPath(path.relative(ROOT, OUTPUT_FILE))}`);
}

main().catch((error) => {
  console.error('Failed to generate route matrix report.');
  console.error(error);
  process.exitCode = 1;
});
