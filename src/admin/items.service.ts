import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItemEntity } from '../entities/menu-item.entity';
import { MenuSectionEntity } from '../entities/menu-section.entity';
import { MenuEntity } from '../entities/menu.entity';
import { MenuItemSectionEntity } from '../entities/menu-item-section.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';

@Injectable()
export class MenuItemsService {
        constructor(
            @InjectRepository(MenuItemEntity) private readonly itemsRepo: Repository<MenuItemEntity>,
            @InjectRepository(MenuSectionEntity) private readonly sectionsRepo: Repository<MenuSectionEntity>,
                @InjectRepository(MenuEntity) private readonly menusRepo: Repository<MenuEntity>,
                @InjectRepository(MenuItemSectionEntity) private readonly itemSectionsRepo: Repository<MenuItemSectionEntity>,
        ) {}

    async listItemsByRestaurant(restaurantId: string) {
        // join item -> section -> menu and filter by menu.restaurant_id
            const qb = this.itemsRepo.createQueryBuilder('it')
                .leftJoinAndSelect('it.items', 'mis')
                .leftJoin('mis.section', 'sec')
                .leftJoin('sec.menu', 'menu')
                .where('menu.restaurant_id = :rid', { rid: restaurantId })
                .orderBy('it.sort_order', 'ASC');
        const items = await qb.getMany();
        return items;
    }

    async createItemForRestaurant(restaurantId: string, dto: CreateMenuItemDto) {
        // Load the section and its menu to validate ownership
        const section = await this.sectionsRepo.createQueryBuilder('s')
            .leftJoinAndSelect('s.menu', 'm')
            .where('s.id = :sid', { sid: dto.section_id })
            .getOne();
        if (!section) throw new NotFoundException('section_not_found');
        if (!section.menu || section.menu.restaurant_id !== restaurantId) {
            throw new BadRequestException('section_not_in_restaurant');
        }

                const item = this.itemsRepo.create({
                    name: dto.name,
                    description: dto.description ?? null,
                    sort_order: dto.sort_order ?? 0,
                    currency_code: dto.currency_code ?? 'USD',
                    is_available: dto.is_available ?? true,
                    restaurant_id: restaurantId,
                } as Partial<MenuItemEntity>);
            const saved = await this.itemsRepo.save(item);

            // create link row in menu_item_sections
            const link = this.itemSectionsRepo.create({
                item_id: saved.id,
                section_id: section.id,
            });
            await this.itemSectionsRepo.save(link);
            return saved;
    }
}
