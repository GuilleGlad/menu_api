import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from '../entities/tag.entity';
import { RestaurantEntity } from '../entities/restaurant.entity';
import { MenuItemEntity } from '../entities/menu-item.entity';
import { ItemTagEntity } from '../entities/item-tag.entity';
import { RestaurantTagEntity } from 'src/entities/restaurant-tag.entity';

@Injectable()
export class TagsAdminService {
  constructor(
    @InjectRepository(TagEntity) private readonly tagsRepo: Repository<TagEntity>,
    @InjectRepository(RestaurantEntity) private readonly restaurantsRepo: Repository<RestaurantEntity>,
    @InjectRepository(MenuItemEntity) private readonly itemsRepo: Repository<MenuItemEntity>,
    @InjectRepository(ItemTagEntity) private readonly itemTagsRepo: Repository<ItemTagEntity>,
    @InjectRepository(RestaurantTagEntity) private readonly restaurantTagsRepo: Repository<RestaurantTagEntity>,
  ) {}

  // Returns an array of { id?, name }
  async listRestaurantTags(restaurantId: string) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('restaurant_not_found');

    const rows: Array<{ tag: string }> = await this.tagsRepo.manager.query(
      'SELECT tag FROM restaurant_tags WHERE restaurant_slug = $1 ORDER BY tag ASC',
      [restaurant.slug],
    );
    return rows.map((r, i) => ({ id: null, name: r.tag }));
  }

  // Create or link a tag to the restaurant (uses restaurant_slug/tag table)
  async createRestaurantTag(restaurantId: string, code: string | null, name: string) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('restaurant_not_found');

    // ensure tag exists in global tags table (optional)
    // validate unique code
    if (code) {
      const existingByCode = await this.tagsRepo.findOne({ where: { code } });
      if (existingByCode) {
        throw new BadRequestException('tag_code_already_exists');
      }
    }

    let tag = await this.tagsRepo.findOne({ where: { name } });
    if (!tag) {
      tag = this.tagsRepo.create({ restaurant_id: restaurantId, code: code, name: name } as Partial<TagEntity>);
      tag = await this.tagsRepo.save(tag);
    }

    // insert into restaurant_tags (restaurant_slug, tag) if not exists
    let restaurant_tag = this.restaurantTagsRepo.create({ restaurant_slug: restaurant.slug, tag: name } as Partial<RestaurantTagEntity>);
    restaurant_tag = await this.restaurantTagsRepo.save(restaurant_tag);
    return {tag, restaurant_tag};
  }

  async updateTag(tagId: string, patch: Partial<TagEntity>) {
    const tag = await this.tagsRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('tag_not_found');

    if (patch.code !== undefined && patch.code !== tag.code) {
      const existing = await this.tagsRepo.findOne({ where: { code: patch.code } });
      if (existing && existing.id !== tagId) {
        throw new BadRequestException('tag_code_already_exists');
      }
      tag.code = patch.code as string;
    }

    if (patch.name !== undefined) tag.name = patch.name as string;
    if (patch.icon_url !== undefined) tag.icon_url = patch.icon_url as string | null;

    return this.tagsRepo.save(tag);
  }

  async deleteTag(tagId: string) {
    const tag = await this.tagsRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('tag_not_found');

    // remove any per-restaurant tag entries that reference this tag name
    await this.tagsRepo.manager.query('DELETE FROM restaurant_tags WHERE tag = $1', [tag.name]);

    await this.tagsRepo.delete(tagId);
    return { ok: true };
  }

  // Add a tag to an item (idempotent)
  async addTagToItem(itemId: string, tagId: string) {
    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('item_not_found');

    const tag = await this.tagsRepo.findOne({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('tag_not_found');

    // If a tag is scoped to a restaurant, ensure it matches the item's restaurant
    if (tag.restaurant_id && tag.restaurant_id !== item.restaurant_id) {
      throw new BadRequestException('tag_belongs_to_different_restaurant');
    }

    const existing = await this.itemTagsRepo.findOne({ where: { item_id: itemId, tag_id: tagId } });
    if (existing) return { ok: true };

    const it = this.itemTagsRepo.create({ item_id: itemId, tag_id: tagId } as Partial<ItemTagEntity>);
    await this.itemTagsRepo.save(it);
    return { ok: true };
  }

  // Remove a tag from an item (idempotent)
  async removeTagFromItem(itemId: string, tagId: string) {
    await this.itemTagsRepo.delete({ item_id: itemId, tag_id: tagId });
    return { ok: true };
  }
}
