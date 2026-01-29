// be/src/kiosk/kiosk.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Host } from '../entities/host.entity';
import { VisitorLog } from '../entities/visitor-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PrintBadgeDto } from './dto/print-badge.dto';

@Injectable()
export class KioskService {
  constructor(
    @InjectRepository(Host) private hostsRepo: Repository<Host>,
    @InjectRepository(VisitorLog) private logsRepo: Repository<VisitorLog>,
    private notifications: NotificationsService,
  ) {}

  async getActiveHosts() {
    const hosts = await this.hostsRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });

    // return only what kiosk needs
    return hosts.map((h) => ({
      id: h.id,
      name: h.name,
      email: h.email,
      department: h.department,
    }));
  }

  async printBadgeAndLog(dto: PrintBadgeDto) {
    const badge_code = uuidv4();

    // IMPORTANT: use entity property names (snake_case)
    const log = this.logsRepo.create({
      first_name: dto.first_name,
      last_name: dto.last_name,
      full_name: dto.full_name,
      reason_for_visit: dto.reason_for_visit,
      host_name: dto.host_name || 'WALK-IN',
      host_email: dto.host_email || null,
      photo_url: dto.photo, // base64 for now
      badge_printed: true,
      notification_sent: false,
      check_in_time: new Date(),

      // NEW: badge / checkout tracking
      badge_code,
      check_out_time: null,
    });

    const saved = await this.logsRepo.save(log);

    // printing stub
    await new Promise((r) => setTimeout(r, 300));

    // send notification if host email exists
    if (dto.host_email) {
      try {
        await this.notifications.sendHostNotification({
          visitor_name: dto.full_name,
          host_email: dto.host_email,
          host_name: dto.host_name,
          reason: dto.reason_for_visit,
          check_in_time: dto.timestamp,
          photo_data_url: dto.photo,
        });

        saved.notification_sent = true;
        await this.logsRepo.save(saved);
      } catch {
        // do NOT fail whole request if notification fails
      }
    }

    return {
      success: true,
      message: 'Badge printed successfully',
      visitor_id: saved.id,
      badge_code: saved.badge_code,
    };
  }

  async checkOutByBadgeCode(badge_code: string) {
    const log = await this.logsRepo.findOne({
      where: { badge_code },
    });

    if (!log) throw new NotFoundException('Badge not found');

    // idempotent checkout
    if (!log.check_out_time) {
      log.check_out_time = new Date();
      await this.logsRepo.save(log);
    }

    return {
      success: true,
      message: 'Checked out successfully',
      visitor: {
        id: log.id,
        badge_code: log.badge_code,
        full_name: log.full_name,
        host_name: log.host_name,
        check_in_time: log.check_in_time,
        check_out_time: log.check_out_time,
      },
    };
  }
}
