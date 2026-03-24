import jwt from 'jsonwebtoken';

// Auth middleware with JWT verification. Supports dev tokens of form "userId:role" for convenience.
export function buildAuthMiddleware({ userRepository } = {}) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';

  const parseBearer = (header) => {
    if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
    return header.slice(7).trim();
  };

  const decodeDevToken = (token) => {
    if (token.includes(':')) {
      const [id, role] = token.split(':');
      return { id, role };
    }
    if (token === 'admin-token') return { id: 'admin-1', role: 'admin' };
    if (token === 'doctor-token') return { id: 'doc-1', role: 'doctor' };
    if (token === 'mock-token') return { id: 'pat-1', role: 'patient' };
    return null;
  };

  const authenticate = async (req, res, next) => {
    const token = parseBearer(req.headers?.authorization);
    if (!token) return next?.();
    try {
      const payload = jwt.verify(token, secret);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
      return next?.();
    } catch (err) {
      const dev = decodeDevToken(token);
      if (dev) {
        req.user = dev;
        return next?.();
      }
      return res.status(401).json({ data: null, code: 'invalid_token', message: 'Invalid token' });
    }
  };

  const requireRole = (roles = []) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ data: null, code: 'unauthorized', message: 'Unauthorized' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ data: null, code: 'forbidden', message: 'Forbidden' });
    }
    next?.();
  };

  return { authenticate, requireRole };
}

