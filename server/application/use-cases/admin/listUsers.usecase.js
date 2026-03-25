import { DomainError } from '../../../domain/exceptions/domainError.js';
import { ListUsersInput } from '../../dto/admin/listUsersInput.js';
import { ListUsersOutput } from '../../dto/admin/listUsersOutput.js';

const normalizeTypeToRole = (type) => {
  const value = String(type || '').trim().toLowerCase();
  if (!value) return undefined;
  if (value === 'doctor' || value === 'patient' || value === 'admin') return value;
  throw new DomainError('Invalid user type filter.');
};

const mapUser = (user) => ({
  id: user.id,
  fullName: user.fullName || '',
  email: user.email,
  role: user.role,
  status: user.status,
  type: user.role === 'doctor' ? 'doctor' : user.role === 'patient' ? 'patient' : 'admin',
  createdAt: user.createdAt || null,
  updatedAt: user.updatedAt || null,
});

export class ListUsersUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
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
    const role = normalizeTypeToRole(input.type);
    const query = String(input.query || '').trim();

    const listed = await this.userRepository.list({ page, pageSize, query, role });
    const items = Array.isArray(listed?.items) ? listed.items : [];

    return new ListUsersOutput({
      page,
      pageSize,
      total: Number(listed?.total) || items.length,
      users: items.map(mapUser),
    });
  }
}
