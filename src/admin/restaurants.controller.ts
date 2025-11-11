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
import { AdminMenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuItemsService } from './items.service';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class RestaurantsAdminController {
  constructor(
    private readonly service: PublicService,
    private readonly menus: AdminMenusService,
    private readonly items: MenuItemsService,
  ) {}

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

  // Menus for a restaurant
  @Get('restaurants/:id/menus')
  @Roles('admin')
  listMenus(@Param('id') id: string) {
    return this.menus.listMenusForRestaurant(id);
  }

  @Post('restaurants/:id/menus')
  @Roles('admin')
  createMenu(@Param('id') id: string, @Body() body: CreateMenuDto) {
    return this.menus.createMenuForRestaurant(id, body);
  }

  @Get('restaurants/:id/items')
  @Roles('admin')
  listItemsByRestaurant(@Param('id') id: string) {
    return this.items.listItemsByRestaurant(id);
  }

  @Post('restaurants/:id/items')
  @Roles('admin')
  createItem(@Param('id') id: string, @Body() body: CreateMenuItemDto) {
    return this.items.createItemForRestaurant(id, body);
  }
}
