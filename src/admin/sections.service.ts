import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MenuSectionEntity } from '../entities/menu-section.entity';
import { MenuEntity } from '../entities/menu.entity';
import { CreateMenuSectionDto } from './dto/create-menu-section.dto';
import { UpdateMenuSectionDto } from './dto/update-menu-section.dto';
import { MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemSectionEntity } from 'src/entities/menu-item-section.entity';
@Injectable()
export class AdminMenuSectionsService {
  constructor(
    @InjectRepository(MenuSectionEntity) private readonly sectionsRepo: Repository<MenuSectionEntity>,
    @InjectRepository(MenuEntity) private readonly menusRepo: Repository<MenuEntity>,
    @InjectRepository(MenuItemEntity) private readonly itemsRepo: Repository<MenuItemEntity>,
    @InjectRepository(MenuItemSectionEntity) private readonly itemSectionsRepo: Repository<MenuItemSectionEntity>,
  ) {}

  async createSection(menuId: string, dto: CreateMenuSectionDto) {
    const menu = await this.menusRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('menu_not_found');
    const section = this.sectionsRepo.create({
      menu_id: menu.id,
      name: dto.name || 'Section',
      description: dto.description ?? null,
      sort_order: dto.sort_order ?? 0,
    });
    return this.sectionsRepo.save(section);
  }

  async getSection(sectionId: string) {
    const s = await this.sectionsRepo.findOne({ where: { id: sectionId } });
    if (!s) throw new NotFoundException('section_not_found');
    return s;
  }

  async updateSection(sectionId: string, dto: UpdateMenuSectionDto) {
    const s = await this.sectionsRepo.findOne({ where: { id: sectionId } });
    if (!s) throw new NotFoundException('section_not_found');
  if (dto.name !== undefined) s.name = dto.name;
    if (dto.description !== undefined) s.description = dto.description;
    if (dto.sort_order !== undefined) s.sort_order = dto.sort_order;
    return this.sectionsRepo.save(s);
  }

  async deleteSection(sectionId: string) {
    const s = await this.sectionsRepo.findOne({ where: { id: sectionId } });
    if (!s) throw new NotFoundException('section_not_found');
    await this.sectionsRepo.delete(sectionId);
    return { ok: true };
  }

  async reorderItems(sectionId: string, orderedItemIds: string[]) {
    if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
      throw new BadRequestException('empty_items');
    }
    const items = await this.itemsRepo.find({ where: { id: In(orderedItemIds)} });
    if (items.length !== orderedItemIds.length) {
      throw new BadRequestException('mismatched_items');
    }
    // Assign new sort_order based on index in array
    const updates = items.map((it) => {
      const idx = orderedItemIds.indexOf(it.id);
      it.sort_order = idx >= 0 ? idx : it.sort_order;
      return it;
    });
    await this.itemsRepo.save(updates);
    return { ok: true };
  }

  async reorderSections(menuId: string, orderedSectionIds: string[]) {
    const menu = await this.menusRepo.findOne({ where: { id: menuId } });
    if (!menu) throw new NotFoundException('menu_not_found');
    if (!Array.isArray(orderedSectionIds) || orderedSectionIds.length === 0) {
      throw new BadRequestException('empty_sections');
    }
    const sections = await this.sectionsRepo.find({ where: { id: In(orderedSectionIds), menu_id: menuId } });
    if (sections.length !== orderedSectionIds.length) {
      throw new BadRequestException('mismatched_sections');
    }
    const updates = sections.map((sec) => {
      const idx = orderedSectionIds.indexOf(sec.id);
      sec.sort_order = idx >= 0 ? idx : sec.sort_order;
      return sec;
    });
    await this.sectionsRepo.save(updates);
    return { ok: true };
  }

  async addItemToSection(sectionId: string, itemId: string) {
    const section = await this.sectionsRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.menu', 'm')
      .where('s.id = :sid', { sid: sectionId })
      .getOne();
    if (!section) throw new NotFoundException('section_not_found');

    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('item_not_found');

    // ensure item belongs to the same restaurant as the section's menu
    if (!section.menu || section.menu.restaurant_id !== item.restaurant_id) {
      throw new BadRequestException('item_not_in_restaurant');
    }

    // upsert link
    const exists = await this.itemSectionsRepo.findOne({ where: { item_id: itemId, section_id: sectionId } });
    if (exists) return { ok: true };

    const link = this.itemSectionsRepo.create({ item_id: itemId, section_id: sectionId });
    await this.itemSectionsRepo.save(link);
    return { ok: true };
  }

  async removeItemFromSection(sectionId: string, itemId: string) {
    const section = await this.sectionsRepo.findOne({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('section_not_found');
    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('item_not_found');

    await this.itemSectionsRepo.delete({ item_id: itemId, section_id: sectionId });
    return { ok: true };
  }
}
