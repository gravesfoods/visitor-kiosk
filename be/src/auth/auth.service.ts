import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

import { User } from '../entities/user.entity';
import { UserRole, type AppRole } from '../entities/user-role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(UserRole) private rolesRepo: Repository<UserRole>,
    private jwt: JwtService,
  ) {}

  private async getUserRoles(userId: string): Promise<AppRole[]> {
    const roles = await this.rolesRepo.find({ where: { user_id: userId } });
    return roles.map((r) => r.role);
  }

  async signup(email: string, password: string, fullName: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email: normalized } });
    if (existing) throw new BadRequestException('This email is already registered.');

    const password_hash = await argon2.hash(password);

    const user = this.usersRepo.create({
      email: normalized,
      password_hash,
      full_name: fullName.trim(),
      is_active: true,
    });

    const saved = await this.usersRepo.save(user);

    // default role = user (admin is assigned separately)
    const ur = this.rolesRepo.create({ user_id: saved.id, role: 'user' });
    await this.rolesRepo.save(ur);

    return { id: saved.id, email: saved.email, full_name: saved.full_name };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email: normalized } });
    if (!user || !user.is_active) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const roles = await this.getUserRoles(user.id);

    const access_token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      roles,
    });

    return {
      access_token,
      user: { id: user.id, email: user.email, full_name: user.full_name, roles },
    };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const roles = await this.getUserRoles(user.id);
    return { id: user.id, email: user.email, full_name: user.full_name, roles };
  }
}
