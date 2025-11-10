import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuEntity } from '../entities/menu.entity';
import { RestaurantEntity } from '../entities/restaurant.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class AdminMenusService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menusRepo: Repository<MenuEntity>,
    @InjectRepository(RestaurantEntity)
    private readonly restaurantsRepo: Repository<RestaurantEntity>,
  ) {}

  async listMenusForRestaurant(restaurantId: string) {
    const r = await this.menusRepo.find({
      where: { restaurant_id: restaurantId },
      order: { sort_order: 'ASC', created_at: 'DESC' as any },
    });
    return r;
  }

  async createMenuForRestaurant(restaurantId: string, dto: CreateMenuDto) {
    const restaurant = await this.restaurantsRepo.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('restaurant_not_found');

    const published_at = dto.published_at ? new Date(dto.published_at) : null;
    const is_published = dto.is_published ?? (!!published_at);

    const entity = this.menusRepo.create({
      restaurant_id: restaurant.id,
      restaurant_slug: restaurant.slug,
      name: dto.name || 'Menu',
      description: dto.description ?? null,
      is_published,
      sort_order: 0,
      content: dto.content ?? null,
      published_at,
    });
    console.log(entity);
    const saved = await this.menusRepo.save(entity);
    return saved;
  }

  async getMenu(menuId: string) {
    const menu = await this.menusRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('menu_not_found');
    return menu;
  }

  async updateMenu(menuId: string, dto: UpdateMenuDto) {
    const menu = await this.menusRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('menu_not_found');

    if (dto.name !== undefined) menu.name = dto.name;
    if (dto.description !== undefined) menu.description = dto.description;
    if (dto.sort_order !== undefined) menu.sort_order = dto.sort_order;
    if (dto.content !== undefined) menu.content = dto.content;
    if (dto.valid_from !== undefined) menu.valid_from = dto.valid_from ? new Date(dto.valid_from as any) : null;
    if (dto.valid_to !== undefined) menu.valid_to = dto.valid_to ? new Date(dto.valid_to as any) : null;

    // Publication state: allow either direct flags or implicit behavior
    if (dto.is_published !== undefined) {
      menu.is_published = dto.is_published;
      if (dto.is_published && !menu.published_at) {
        menu.published_at = new Date();
      } else if (!dto.is_published) {
        menu.published_at = null;
      }
    }
    if (dto.published_at !== undefined) {
      const ts = dto.published_at ? new Date(dto.published_at as any) : null;
      menu.published_at = ts;
      if (ts) menu.is_published = true; // keep consistency
    }

    return this.menusRepo.save(menu);
  }

  async publishMenu(menuId: string) {
    const menu = await this.menusRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('menu_not_found');
    if (menu.is_published) return menu; // idempotent
    menu.is_published = true;
    menu.published_at = new Date();
    return this.menusRepo.save(menu);
  }

  async unpublishMenu(menuId: string) {
    const menu = await this.menusRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('menu_not_found');
    if (!menu.is_published) return menu; // idempotent
    menu.is_published = false;
    menu.published_at = null;
    return this.menusRepo.save(menu);
  }
}
