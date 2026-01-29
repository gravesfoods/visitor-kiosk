// be/src/admin/admin.controller.ts

import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { HostUpsertDto } from './dto/host-upsert.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  async stats() {
    return this.admin.getStats();
  }

  @Get('hosts')
  async hosts() {
    return this.admin.listHosts();
  }

  @Post('hosts')
  async createHost(@Body() dto: HostUpsertDto) {
    return this.admin.createHost(dto);
  }

  @Put('hosts/:id')
  async updateHost(@Param('id') id: string, @Body() dto: HostUpsertDto) {
    return this.admin.updateHost(id, dto);
  }

  @Patch('hosts/:id/active')
  async setActive(@Param('id') id: string, @Body() body: { is_active: boolean }) {
    return this.admin.toggleHost(id, !!body.is_active);
  }

  @Delete('hosts/:id')
  async deleteHost(@Param('id') id: string) {
    return this.admin.deleteHost(id);
  }

  @Get('visitor-logs')
  async visitorLogs(
    @Query('search') search?: string,
    @Query('limit', new DefaultValuePipe('100')) limit?: string,
  ) {
    return this.admin.listVisitorLogs({
      search,
      limit: limit ? Number(limit) : 100,
    });
  }

  @Get('visitor-logs/:id')
  async getVisitorLog(@Param('id') id: string) {
    return this.admin.getVisitorLogById(id);
  }

  @Delete('visitor-logs/:id')
  async deleteVisitorLog(@Param('id') id: string) {
    return this.admin.deleteVisitorLog(id);
  }

  // ✅ NEW: Admin manual check-out
  @Patch('visitor-logs/:id/check-out')
  async checkOutVisitor(@Param('id') id: string) {
    return this.admin.checkOutVisitorLog(id);
  }

  // Optional admin grant endpoint (keep, even if not wired yet)
  @Post('users/:id/grant-admin')
  async grantAdmin(@Param('id') userId: string) {
    return this.admin.grantAdmin(userId);
  }
}
