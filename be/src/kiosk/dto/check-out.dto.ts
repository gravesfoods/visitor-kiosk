// be/src/kiosk/dto/check-out.dto.ts

import { IsUUID } from 'class-validator';

export class CheckOutDto {
  @IsUUID()
  badge_code: string;
}
