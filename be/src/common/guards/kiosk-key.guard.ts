import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KioskKeyGuard implements CanActivate {
  constructor(private cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const headerKey = (req.headers['x-kiosk-key'] as string | undefined)?.trim();
    const kioskKey = this.cfg.get<string>('KIOSK_KEY');

    if (!kioskKey) throw new UnauthorizedException('Kiosk key not configured');
    if (!headerKey || headerKey !== kioskKey) throw new UnauthorizedException('Invalid kiosk key');
    return true;
  }
}
