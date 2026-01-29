import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';
import { Host } from '../entities/host.entity';
import { VisitorLog } from '../entities/visitor-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Host, VisitorLog]), NotificationsModule],
  controllers: [KioskController],
  providers: [KioskService],
})
export class KioskModule {}
