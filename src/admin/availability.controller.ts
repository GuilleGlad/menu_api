import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { AvailabilityAdminService } from './availability.service';
import type { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import type { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class AvailabilityAdminController {
  constructor(private readonly service: AvailabilityAdminService) {}

  // GET /v1/admin/restaurants/{id}/availability-rules
  @Get('restaurants/:restaurant_id/availability-rules')
  @Roles('admin')
  list(@Param('restaurant_id') restaurantId: string) {
    return this.service.listForRestaurant(restaurantId);
  }

  // POST /v1/admin/availability-rules
  @Post('availability-rules')
  @Roles('admin')
  create(@Body() body: CreateAvailabilityRuleDto) {
    return this.service.createRule(body);
  }

  // PATCH /v1/admin/availability-rules/{rule_id}
  @Patch('availability-rules/:rule_id')
  @Roles('admin')
  update(@Param('rule_id') ruleId: string, @Body() body: UpdateAvailabilityRuleDto) {
    return this.service.updateRule(ruleId, body);
  }

  // DELETE /v1/admin/availability-rules/{rule_id}
  @Delete('availability-rules/:rule_id')
  @Roles('admin')
  remove(@Param('rule_id') ruleId: string) {
    return this.service.deleteRule(ruleId);
  }
}
