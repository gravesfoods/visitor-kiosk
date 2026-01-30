// be/src/kiosk/kiosk.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Host } from '../entities/host.entity';
import { VisitorLog } from '../entities/visitor-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';
import { PrintNodeService } from './utils/printnode.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Host, VisitorLog]), NotificationsModule],
  controllers: [KioskController],
  providers: [KioskService, PrintNodeService],
})
export class KioskModule {}
