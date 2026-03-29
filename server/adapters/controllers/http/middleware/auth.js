import jwt from 'jsonwebtoken';

// Auth middleware with strict JWT verification.
export function buildAuthMiddleware({ userRepository } = {}) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';

  const parseBearer = (header) => {
    if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
    return header.slice(7).trim();
  };

  const authenticate = async (req, res, next) => {
    const token = parseBearer(req.headers?.authorization);
    if (!token) return next?.();
    try {
      const payload = jwt.verify(token, secret);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };

      if (userRepository && req.user?.id) {
        const dbUser = await userRepository.findById(req.user.id);
        if (dbUser) {
          req.user = {
            ...req.user,
            patientId: dbUser.patientId ?? null,
            doctorId: dbUser.doctorId ?? null,
          };
        }
      }

      return next?.();
    } catch (err) {
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

