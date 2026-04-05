import { DomainError } from '../../../domain/exceptions/domainError.js';
import { CreateUserInput } from '../../dto/admin/createUserInput.js';
import { CreateUserOutput } from '../../dto/admin/createUserOutput.js';

const ALLOWED_ROLES = new Set(['patient', 'doctor', 'admin']);
const ALLOWED_STATUS = new Set(['active', 'inactive', 'disabled', 'verified', 'pending']);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export class CreateUserUseCase {
  constructor({ userRepository, authService, doctorRepository, patientRepository }) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.doctorRepository = doctorRepository;
    this.patientRepository = patientRepository;
  }

  async ensureDoctorProfileLink(user, { fullName, email, status, specialization, department, slotsPerDay }) {
    if (!this.doctorRepository?.save) {
      return user;
    }

    const preferredDoctorId = user?.doctorId || user?.id || null;
    let doctorProfile = null;

    if (preferredDoctorId && this.doctorRepository?.findById) {
      doctorProfile = await this.doctorRepository.findById(preferredDoctorId);
    }

    if (!doctorProfile) {
      doctorProfile = await this.doctorRepository.save({
        id: preferredDoctorId,
        fullName,
        specialization: String(specialization || 'General').trim() || 'General',
        department: String(department || '').trim(),
        availableSlotsPerDay: Math.max(0, Number(slotsPerDay) || 0),
        contactInfo: {
          email,
          phone: null,
        },
        status,
      });
    }

    const doctorId = doctorProfile?.id ?? doctorProfile?.getId?.() ?? null;
    if (!doctorId || user?.doctorId === doctorId) {
      return user;
    }

    return this.userRepository.save({
      ...user,
      doctorId,
      patientId: null,
    });
  }

  async ensurePatientProfileLink(user, { fullName, email, status, dateOfBirth, phone, address, emergencyContact, assignedDoctorId }) {
    if (!this.patientRepository?.create && !this.patientRepository?.save) {
      return user;
    }

    const preferredPatientId = user?.patientId || user?.id || null;
    let patientProfile = null;

    if (preferredPatientId && this.patientRepository?.findById) {
      patientProfile = await this.patientRepository.findById(preferredPatientId);
    }

    if (!patientProfile) {
      const payload = {
        id: preferredPatientId,
        fullName,
        dateOfBirth: dateOfBirth || null,
        contactInfo: {
          email,
          phone: phone || null,
          address: address || null,
          emergencyContact: emergencyContact || null,
        },
        status,
        assignedDoctorId: assignedDoctorId || null,
      };

      patientProfile = this.patientRepository.create
        ? await this.patientRepository.create(payload)
        : await this.patientRepository.save(payload);
    }

    const patientId = patientProfile?.id ?? patientProfile?.getId?.() ?? null;
    if (!patientId || user?.patientId === patientId) {
      return user;
    }

    return this.userRepository.save({
      ...user,
      patientId,
      doctorId: null,
    });
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

    const baseUser = await this.userRepository.save({
      email,
      fullName,
      role,
      status,
      passwordHash,
      doctorId: role === 'doctor' ? input.doctorId ?? null : null,
      patientId: role === 'patient' ? input.patientId ?? null : null,
    });

    let saved = baseUser;
    if (role === 'doctor') {
      saved = await this.ensureDoctorProfileLink(saved, {
        fullName,
        email,
        status,
        specialization: input.specialization,
        department: input.department,
        slotsPerDay: input.slotsPerDay,
      });
    }

    if (role === 'patient') {
      saved = await this.ensurePatientProfileLink(saved, {
        fullName,
        email,
        status,
        dateOfBirth: input.dateOfBirth,
        phone: input.phone,
        address: input.address,
        emergencyContact: input.emergencyContact,
        assignedDoctorId: input.assignedDoctorId,
      });
    }

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
