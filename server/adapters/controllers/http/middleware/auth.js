import jwt from 'jsonwebtoken';

// Auth middleware with strict JWT verification.
export function buildAuthMiddleware({ userRepository, doctorRepository } = {}) {
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
          const role = String(dbUser.role ?? req.user.role ?? '').toLowerCase();
          const fallbackPatientId = role === 'patient' ? dbUser.id : null;
          let resolvedDoctorId = dbUser.doctorId ?? null;

          if (!resolvedDoctorId && role === 'doctor' && doctorRepository) {
            if (dbUser.id && typeof doctorRepository.findById === 'function') {
              const doctorByUserId = await doctorRepository.findById(dbUser.id);
              resolvedDoctorId = doctorByUserId?.id ?? doctorByUserId?.getId?.() ?? null;
            }

            if (!resolvedDoctorId && dbUser.email && typeof doctorRepository.findByEmail === 'function') {
              const doctorByEmail = await doctorRepository.findByEmail(dbUser.email);
              resolvedDoctorId = doctorByEmail?.id ?? doctorByEmail?.getId?.() ?? null;
            }
          }

          req.user = {
            ...req.user,
            patientId: dbUser.patientId ?? fallbackPatientId,
            doctorId: resolvedDoctorId,
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

