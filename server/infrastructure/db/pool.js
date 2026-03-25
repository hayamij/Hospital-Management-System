let mssqlPoolPromise = null;

const getMssqlPool = async () => {
  if (mssqlPoolPromise) return mssqlPoolPromise;

  mssqlPoolPromise = (async () => {
    const mssqlModule = await import('mssql');
    const sql = mssqlModule.default ?? mssqlModule;
    const connection = new sql.ConnectionPool({
      server: process.env.MSSQL_SERVER || 'PHUONGTUAN',
      user: process.env.MSSQL_USER || 'fuongtuan',
      password: process.env.MSSQL_PASSWORD || 'toilabanhmochi',
      database: process.env.MSSQL_DATABASE || 'HospitalManagementSystem',
      options: {
        encrypt: String(process.env.MSSQL_ENCRYPT || 'false').toLowerCase() === 'true',
        trustServerCertificate: String(process.env.MSSQL_TRUST_SERVER_CERT || 'true').toLowerCase() === 'true',
      },
      pool: {
        max: Number(process.env.MSSQL_POOL_MAX || 10),
        min: Number(process.env.MSSQL_POOL_MIN || 0),
        idleTimeoutMillis: Number(process.env.MSSQL_POOL_IDLE_MS || 30000),
      },
    });
    await connection.connect();
    return connection;
  })();

  return mssqlPoolPromise;
};

function normalizeForMssql(sql, params = []) {
  const paramMap = new Map();
  let normalized = sql.replace(/\$(\d+)/g, (_, n) => {
    const idx = Number(n) - 1;
    if (!paramMap.has(idx)) {
      paramMap.set(idx, `p${idx + 1}`);
    }
    return `@${paramMap.get(idx)}`;
  });
  normalized = normalized.replace(/^\s*SELECT\s+([\s\S]*?)\s+LIMIT\s+(\d+)\s*;?\s*$/i, (_full, body, limit) => {
    const trimmedBody = String(body || '').trim();
    if (!trimmedBody) {
      return `SELECT TOP ${limit}`;
    }
    if (/^TOP\s+\d+\b/i.test(trimmedBody)) {
      return `SELECT ${trimmedBody}`;
    }
    return `SELECT TOP ${limit} ${trimmedBody}`;
  });
  normalized = normalized.replace(/\bnow\(\)/gi, 'SYSUTCDATETIME()');
  return { sql: normalized, paramMap, values: params };
}

export const pool = {
  async query(sql, params = []) {
    const connection = await getMssqlPool();
    const { sql: normalized, paramMap, values } = normalizeForMssql(sql, params);
    const request = connection.request();
    for (const [idx, paramName] of paramMap.entries()) {
      request.input(paramName, values[idx]);
    }
    try {
      const result = await request.query(normalized);
      return {
        rows: result.recordset ?? [],
        changes: (result.rowsAffected || []).reduce((acc, value) => acc + value, 0),
      };
    } catch (error) {
      console.error('SQL query failed:', normalized);
      throw error;
    }
  },
};
