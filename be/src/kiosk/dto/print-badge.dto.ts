// be/src/kiosk/dto/print-badge.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class PrintBadgeDto {
  @IsString() first_name!: string;
  @IsString() last_name!: string;
  @IsString() full_name!: string;
  @IsString() reason_for_visit!: string;
  @IsString() host_name!: string;

  @IsOptional()
  @IsString()
  host_email?: string;

  @IsString()
  timestamp!: string;

  // base64 data URL string
  @IsString()
  photo!: string;
}
