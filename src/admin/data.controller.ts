import { Controller, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminDataSeedService } from './data-seed.service';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminDataController {
  constructor(private readonly seeder: AdminDataSeedService) {}

  @Post('seed/data')
  @Roles('admin')
  seedData() {
    return this.seeder.seed();
  }
}
