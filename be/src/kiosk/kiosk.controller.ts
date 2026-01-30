// be/src/kiosk/kiosk.controller.ts

import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { KioskKeyGuard } from '../common/guards/kiosk-key.guard';
import { KioskService } from './kiosk.service';
import { PrintBadgeDto } from './dto/print-badge.dto';
import { CheckOutDto } from './dto/check-out.dto';

@UseGuards(KioskKeyGuard)
@Controller('kiosk')
export class KioskController {
  constructor(private kiosk: KioskService) {}

  @Get('hosts')
  async hosts() {
    return this.kiosk.getActiveHosts();
  }

  @Post('print-badge')
  async printBadge(@Body() dto: PrintBadgeDto, @Req() req: Request) {
    // pass IP for lightweight rate limiting / auditing
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    return this.kiosk.printBadgeAndLog(dto, ip);
  }

  @Patch('check-out')
  async checkOut(@Body() dto: CheckOutDto) {
    return this.kiosk.checkOutByBadgeCode(dto.badge_code);
  }
}
