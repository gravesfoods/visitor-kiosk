import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Host } from '../entities/host.entity';
import { VisitorLog } from '../entities/visitor-log.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Host, VisitorLog, User, UserRole])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
