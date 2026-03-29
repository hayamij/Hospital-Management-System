import { AuthServicePort } from '../../application/ports/services/authServicePort.js';

// Adapter: delegates auth operations to an injected implementation (e.g., bcrypt/JWT service)
export class AuthServiceAdapter extends AuthServicePort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async comparePassword(plain, hashed) {
    return this.inner.comparePassword(plain, hashed);
  }

  async generateTokens(payload) {
    return this.inner.generateTokens(payload);
  }

  async revokeTokens(payload) {
    return this.inner.revokeTokens(payload);
  }

  async hashPassword(plain) {
    return this.inner.hashPassword(plain);
  }
}
