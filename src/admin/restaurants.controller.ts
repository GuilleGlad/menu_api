import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PublicService } from '../public/public.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class RestaurantsAdminController {
  constructor(private readonly service: PublicService) {}

  @Get('restaurants')
  @Roles('admin')
  list() {
    return this.service.adminListRestaurants();
  }

  @Post('restaurants')
  @Roles('admin')
  create(@Body() body: CreateRestaurantDto) {
    return this.service.adminCreateRestaurant(body);
  }

  @Get('restaurants/:id')
  @Roles('admin')
  async get(@Param('id') id: string) {
    const r = await this.service.adminGetRestaurantById(id);
    if (!r) throw new NotFoundException();
    return r;
  }

  @Patch('restaurants/:id')
  @Roles('admin')
  async patch(@Param('id') id: string, @Body() body: UpdateRestaurantDto) {
    const r = await this.service.adminUpdateRestaurant(id, body);
    if (!r) throw new NotFoundException();
    return r;
  }

  @Delete('restaurants/:id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const ok = await this.service.adminDeleteRestaurant(id);
    if (!ok) throw new NotFoundException();
    return { ok: true };
  }
}
