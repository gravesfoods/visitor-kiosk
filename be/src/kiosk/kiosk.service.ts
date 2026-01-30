// be/src/kiosk/kiosk.service.ts

import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Host } from '../entities/host.entity';
import { VisitorLog } from '../entities/visitor-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PrintBadgeDto } from './dto/print-badge.dto';
import { buildBadgePdf } from './utils/badge-pdf';
import { PrintNodeService } from './utils/printnode.service';

@Injectable()
export class KioskService {
  // simple in-memory rate limiter (single kiosk = totally fine)
  private static recentPrints: number[] = [];

  constructor(
    @InjectRepository(Host) private hostsRepo: Repository<Host>,
    @InjectRepository(VisitorLog) private logsRepo: Repository<VisitorLog>,
    private notifications: NotificationsService,
    private printNode: PrintNodeService,
  ) {}

  async getActiveHosts() {
    const hosts = await this.hostsRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });

    return hosts.map((h) => ({
      id: h.id,
      name: h.name,
      email: h.email,
      department: h.department,
    }));
  }

  private enforcePrintRateLimit() {
    const now = Date.now();
    // keep only last 60s
    KioskService.recentPrints = KioskService.recentPrints.filter((t) => now - t < 60_000);

    // allow up to 10 prints/minute (tune as you like)
    if (KioskService.recentPrints.length >= 10) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    KioskService.recentPrints.push(now);
  }

  async printBadgeAndLog(dto: PrintBadgeDto, kiosk_ip: string) {
    this.enforcePrintRateLimit();

    const badge_code = uuidv4();

    // Create log first so we always have a record even if printing fails
    const log = this.logsRepo.create({
      first_name: dto.first_name,
      last_name: dto.last_name,
      full_name: dto.full_name,
      reason_for_visit: dto.reason_for_visit,
      host_name: dto.host_name || 'WALK-IN',
      host_email: dto.host_email || null,
      photo_url: dto.photo, // base64 data URL for now
      badge_printed: false, // set true only if PrintNode job succeeds
      notification_sent: false,
      check_in_time: new Date(),

      badge_code,
      check_out_time: null,

      // If your entity has a field for it later, great.
      // For now just keep in logs (DB) what we already store above.
    });

    const saved = await this.logsRepo.save(log);

    // ---- Step 4: Build PDF (2x4 label) ----
    // QR encodes badge_code so check-out scanners can use it.
    let printOk = false;
    let printMessage = 'Badge printed successfully';
    let printnodeJobId: number | null = null;

    try {
      const pdf = await buildBadgePdf({
        badge_code,
        full_name: dto.full_name,
        host_name: dto.host_name || 'WALK-IN',
        reason_for_visit: dto.reason_for_visit,
        timestamp: dto.timestamp,
        photo_data_url: dto.photo,
      });

      // ---- Step 5: Send to PrintNode ----
      const job = await this.printNode.printPdfBuffer(pdf, `Visitor Badge - ${dto.full_name}`);
      printOk = true;
      printnodeJobId = typeof job?.id === 'number' ? job.id : null;

      saved.badge_printed = true;
      await this.logsRepo.save(saved);
    } catch (e: any) {
      // Do not throw; return success=false so FE can show error but still show badge code/QR
      printOk = false;
      printMessage =
        e?.message?.toString?.() ||
        'Unable to print badge (printer service unavailable). Please notify the front desk.';
    }

    // Send notification (independent; don’t fail request if notification fails)
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
        // ignore notification failures
      }
    }

    return {
      success: printOk,
      message: printMessage,
      visitor_id: saved.id,
      badge_code: saved.badge_code,
      kiosk_ip,
      printnode_job_id: printnodeJobId,
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
