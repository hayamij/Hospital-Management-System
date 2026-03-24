import { DomainError } from '../../../domain/exceptions/domainError.js';
import { UpdateUserInput } from '../../dto/admin/updateUserInput.js';
import { UpdateUserOutput } from '../../dto/admin/updateUserOutput.js';

const ALLOWED_ROLES = new Set(['patient', 'doctor', 'admin']);
const ALLOWED_STATUS = new Set(['active', 'inactive', 'disabled', 'verified', 'pending']);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export class UpdateUserUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(inputDto) {
    const input = inputDto instanceof UpdateUserInput ? inputDto : new UpdateUserInput(inputDto ?? {});

    if (!input.adminId) throw new DomainError('Admin id is required.');
    if (!input.userId) throw new DomainError('User id is required.');

    const adminUser = await this.userRepository.findById(input.adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new DomainError('Access denied. Admin role required.');
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new DomainError('User not found.');
    }

    const fullName = input.fullName !== undefined ? String(input.fullName || '').trim() : user.fullName;
    const email = input.email !== undefined ? normalizeEmail(input.email) : user.email;
    const role = input.role !== undefined ? String(input.role || '').trim().toLowerCase() : user.role;
    const status = input.status !== undefined ? String(input.status || '').trim().toLowerCase() : user.status;

    if (!fullName) throw new DomainError('Full name is required.');
    if (!email) throw new DomainError('Email is required.');
    if (!ALLOWED_ROLES.has(role)) throw new DomainError('Invalid role.');
    if (!ALLOWED_STATUS.has(status)) throw new DomainError('Invalid status.');

    if (email !== user.email) {
      const existing = await this.userRepository.findByEmail(email);
      if (existing && existing.id !== user.id) {
        throw new DomainError('Email already exists.');
      }
    }

    const saved = await this.userRepository.save({
      ...user,
      fullName,
      email,
      role,
      status,
    });

    return new UpdateUserOutput({
      userId: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
      status: saved.status,
      updatedAt: saved.updatedAt || new Date().toISOString(),
    });
  }
}
