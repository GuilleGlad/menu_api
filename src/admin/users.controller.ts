import { Controller, Post, UseGuards } from '@nestjs/common';
import { UsersAdminService } from './users.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class UsersAdminController {
  constructor(private readonly service: UsersAdminService) {}

  @Post('users/seed-admins')
  @Roles('manager', 'owner')
  seedAdmins() {
    return this.service.seedAdmins();
  }
}
