// be/src/admin/admin.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Host } from '../entities/host.entity';
import { VisitorLog } from '../entities/visitor-log.entity';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Host) private hostsRepo: Repository<Host>,
    @InjectRepository(VisitorLog) private logsRepo: Repository<VisitorLog>,
    @InjectRepository(UserRole) private rolesRepo: Repository<UserRole>,
  ) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayVisitors, totalVisitors, activeHosts] = await Promise.all([
      this.logsRepo
        .createQueryBuilder('v')
        .where('v.check_in_time >= :today', { today: today.toISOString() })
        .getCount(),
      this.logsRepo.count(),
      this.hostsRepo.count({ where: { is_active: true } }),
    ]);

    return { todayVisitors, totalVisitors, activeHosts };
  }

  async getVisitorLogById(id: string) {
    const log = await this.logsRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Visitor log not found');
    return log;
  }

  async listHosts() {
    return this.hostsRepo.find({ order: { name: 'ASC' } });
  }

  async createHost(data: { name: string; email: string; department?: string | null }) {
    const host = this.hostsRepo.create({
      name: data.name.trim(),
      email: data.email.trim(),
      department: data.department?.trim() || null,
      is_active: true,
    });
    return this.hostsRepo.save(host);
  }

  async deleteVisitorLog(id: string) {
    const res = await this.logsRepo.delete({ id });
    if (!res.affected) throw new NotFoundException('Visitor log not found');
    return { success: true };
  }

  async updateHost(id: string, data: { name: string; email: string; department?: string | null }) {
    const host = await this.hostsRepo.findOne({ where: { id } });
    if (!host) throw new NotFoundException('Host not found');

    host.name = data.name.trim();
    host.email = data.email.trim();
    host.department = data.department?.trim() || null;

    return this.hostsRepo.save(host);
  }

  async toggleHost(id: string, isActive: boolean) {
    const host = await this.hostsRepo.findOne({ where: { id } });
    if (!host) throw new NotFoundException('Host not found');

    host.is_active = isActive;
    return this.hostsRepo.save(host);
  }

  async deleteHost(id: string) {
    const res = await this.hostsRepo.delete({ id });
    if (!res.affected) throw new NotFoundException('Host not found');
    return { success: true };
  }

  async listVisitorLogs(params: { search?: string; limit?: number }) {
    const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);

    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      return this.logsRepo.find({
        where: [
          { full_name: ILike(`%${s}%`) },
          { reason_for_visit: ILike(`%${s}%`) },
          { host_name: ILike(`%${s}%`) },
          // helpful to search by badge code too (if present)
          { badge_code: ILike(`%${s}%`) } as any,
        ],
        order: { check_in_time: 'DESC' },
        take: limit,
      });
    }

    return this.logsRepo.find({
      order: { check_in_time: 'DESC' },
      take: limit,
    });
  }

  // ✅ NEW: Admin manual check-out
  async checkOutVisitorLog(id: string) {
    const log = await this.logsRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Visitor log not found');

    if (!log.check_out_time) {
      log.check_out_time = new Date();
      await this.logsRepo.save(log);
    }

    return {
      success: true,
      visitor: log,
    };
  }

  // Optional: grant admin role to a user (you can expose this later in UI)
  async grantAdmin(userId: string) {
    const existing = await this.rolesRepo.findOne({ where: { user_id: userId, role: 'admin' } });
    if (existing) throw new BadRequestException('User is already an admin');

    const role = this.rolesRepo.create({ user_id: userId, role: 'admin' });
    await this.rolesRepo.save(role);
    return { success: true };
  }
}
