import { DomainError } from '../../../domain/exceptions/domainError.js';
import { CreateUserInput } from '../../dto/admin/createUserInput.js';
import { CreateUserOutput } from '../../dto/admin/createUserOutput.js';

const ALLOWED_ROLES = new Set(['patient', 'doctor', 'admin']);
const ALLOWED_STATUS = new Set(['active', 'inactive', 'disabled', 'verified', 'pending']);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export class CreateUserUseCase {
  constructor({ userRepository, authService }) {
    this.userRepository = userRepository;
    this.authService = authService;
  }

  async execute(inputDto) {
    const input = inputDto instanceof CreateUserInput ? inputDto : new CreateUserInput(inputDto ?? {});

    if (!input.adminId) throw new DomainError('Admin id is required.');

    const adminUser = await this.userRepository.findById(input.adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new DomainError('Access denied. Admin role required.');
    }

    const fullName = String(input.fullName || '').trim();
    const email = normalizeEmail(input.email);
    const role = String(input.role || '').trim().toLowerCase();
    const status = String(input.status || 'active').trim().toLowerCase();

    if (!fullName) throw new DomainError('Full name is required.');
    if (!email) throw new DomainError('Email is required.');
    if (!ALLOWED_ROLES.has(role)) throw new DomainError('Invalid role.');
    if (!ALLOWED_STATUS.has(status)) throw new DomainError('Invalid status.');

    const exists = await this.userRepository.findByEmail(email);
    if (exists) {
      throw new DomainError('Email already exists.');
    }

    let passwordHash = null;
    const plainPassword = String(input.password || '').trim();
    if (plainPassword) {
      passwordHash = this.authService?.hashPassword
        ? await this.authService.hashPassword(plainPassword)
        : plainPassword;
    }

    const saved = await this.userRepository.save({
      email,
      fullName,
      role,
      status,
      passwordHash,
      doctorId: role === 'doctor' ? undefined : null,
      patientId: role === 'patient' ? undefined : null,
    });

    return new CreateUserOutput({
      userId: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
      status: saved.status,
      createdAt: saved.createdAt || new Date().toISOString(),
    });
  }
}
