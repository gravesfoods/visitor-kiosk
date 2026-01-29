import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { KioskModule } from './kiosk/kiosk.module';

import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { Host } from './entities/host.entity';
import { VisitorLog } from './entities/visitor-log.entity';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        entities: [User, UserRole, Host, VisitorLog],
        synchronize: true, // ✅ for quick start; switch to migrations for production
        logging: false,
      }),
    }),

    NotificationsModule,
    AuthModule,
    AdminModule,
    KioskModule,
  ],
})
export class AppModule {}
