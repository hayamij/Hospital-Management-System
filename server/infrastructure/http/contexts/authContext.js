import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { LoginUseCase } from '../../../application/use-cases/auth/login.usecase.js';
import { LogoutUseCase } from '../../../application/use-cases/auth/logout.usecase.js';
import { ResetPasswordUseCase } from '../../../application/use-cases/auth/resetPassword.usecase.js';
import { adaptUseCase, normalizeIdentifier } from './common.js';

const unauthorizedError = (message = 'Invalid credentials') => {
  const err = new Error(message);
  err.status = 401;
  err.code = 'invalid_credentials';
  return err;
};

export const createAuthService = ({ userRepository, pool }) => {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const accessTtl = process.env.JWT_ACCESS_TTL || '15m';
  const refreshTtlMs = Number(
    process.env.JWT_REFRESH_TTL_MS || 1000 * 60 * 60 * 24 * 7
  );

  const signAccessToken = (user) =>
    jwt.sign(
      { role: user.role, email: user.email },
      jwtSecret,
      { expiresIn: accessTtl, subject: user.id }
    );

  const issueRefreshToken = async (user) => {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + refreshTtlMs).toISOString();
    await pool.query(
      'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)',
      [token, user.id, expiresAt]
    );
    return { token, expiresAt };
  };

  const revokeRefreshToken = async (token) => {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  };

  return {
    comparePassword: async (plainText, hashedPassword) =>
      bcrypt.compare(plainText ?? '', hashedPassword ?? ''),
    hashPassword: async (plainText) => bcrypt.hash(plainText ?? '', 10),
    generateTokens: async ({ userId, role }) => {
      const user = await userRepository.findById(userId);
      if (!user) throw unauthorizedError();
      const accessToken = signAccessToken({
        id: user.id,
        role: role ?? user.role,
        email: user.email,
      });
      const refresh = await issueRefreshToken(user);
      return {
        accessToken,
        refreshToken: refresh.token,
        expiresAt: refresh.expiresAt,
      };
    },
    revokeTokens: async ({ refreshToken }) => {
      if (refreshToken) await revokeRefreshToken(refreshToken);
    },
  };
};

export const createAuthUseCases = ({ userRepository, authService }) => {
  const loginClass = new LoginUseCase({ userRepository, authService });
  const logoutClass = new LogoutUseCase({ userRepository, authService });
  const resetPasswordClass = new ResetPasswordUseCase({ userRepository, authService });

  const loginUseCase = adaptUseCase(
    loginClass,
    (input) => ({
      email: normalizeIdentifier(input?.identifier ?? input?.email),
      password: input?.password,
    }),
    (result) => ({ ...result, token: result?.token ?? result?.accessToken ?? null })
  );

  const resetPasswordUseCase = adaptUseCase(resetPasswordClass, (input) => ({
    email: normalizeIdentifier(input?.email),
    oldPassword: input?.oldPassword ?? input?.currentPassword,
    newPassword: input?.newPassword,
  }));

  return {
    loginUseCase,
    logoutUseCase: logoutClass,
    resetPasswordUseCase,
  };
};
