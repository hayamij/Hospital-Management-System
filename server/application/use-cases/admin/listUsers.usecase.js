import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ListUsersInput } from '../../dto/admin/listUsersInput.js';
import { ListUsersOutput } from '../../dto/admin/listUsersOutput.js';

const normalizeRoleFilter = ({ role, type }) => {
  const value = String(role ?? type ?? '').trim().toLowerCase();
  if (!value) return undefined;
  if (value === 'doctor' || value === 'patient' || value === 'admin') return value;
  throw new DomainError('Invalid user role filter.');
};

const extractFullName = (entity) => {
  if (!entity) return '';
  if (typeof entity.fullName === 'string' && entity.fullName.trim()) return entity.fullName;
  if (typeof entity.getName === 'function') {
    const name = entity.getName();
    if (typeof name === 'string' && name.trim()) return name;
  }
  return '';
};

const mapUser = (user, resolvedFullName) => ({
  id: user.id,
  fullName: resolvedFullName || user.fullName || '',
  email: user.email,
  role: user.role,
  status: user.status,
  type: user.role === 'doctor' ? 'doctor' : user.role === 'patient' ? 'patient' : 'admin',
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null,
});

export class ListUsersUseCase {
  constructor({ userRepository, doctorRepository, patientRepository }) {
    this.userRepository = userRepository;
    this.doctorRepository = doctorRepository;
    this.patientRepository = patientRepository;
  }

  async resolveProfileFullName(user) {
    const role = String(user?.role || '').toLowerCase();

    if (role === 'doctor' && user?.doctorId && this.doctorRepository?.findById) {
      const doctor = await this.doctorRepository.findById(user.doctorId);
      const doctorName = extractFullName(doctor);
      if (doctorName) return doctorName;
    }

    if (role === 'patient' && user?.patientId && this.patientRepository?.findById) {
      const patient = await this.patientRepository.findById(user.patientId);
      const patientName = extractFullName(patient);
      if (patientName) return patientName;
    }

    return user?.fullName || '';
  }

  async execute(inputDto) {
    const input = inputDto instanceof ListUsersInput ? inputDto : new ListUsersInput(inputDto ?? {});

    if (!input.adminId) {
      throw new DomainError('Admin id is required.');
    }

    const adminUser = await this.userRepository.findById(input.adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new DomainError('Access denied. Admin role required.');
    }

    const page = Math.max(1, Number(input.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(input.pageSize) || 10));
    const role = normalizeRoleFilter({ role: input.role, type: input.type });
    const query = String(input.query || '').trim();

    const listed = await this.userRepository.list({ page, pageSize, query, role });
    const items = Array.isArray(listed?.items) ? listed.items : [];
    const users = await Promise.all(
      items.map(async (user) => {
        const fullName = await this.resolveProfileFullName(user);
        return mapUser(user, fullName);
      }),
    );

    return new ListUsersOutput({
      page,
      pageSize,
      total: Number(listed?.total) || items.length,
      users,
    });
  }
}
