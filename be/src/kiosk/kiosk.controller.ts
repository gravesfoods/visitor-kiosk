// be/src/kiosk/kiosk.controller.ts

import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
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
  async printBadge(@Body() dto: PrintBadgeDto) {
    return this.kiosk.printBadgeAndLog(dto);
  }

  @Patch('check-out')
  async checkOut(@Body() dto: CheckOutDto) {
    return this.kiosk.checkOutByBadgeCode(dto.badge_code);
  }
}
