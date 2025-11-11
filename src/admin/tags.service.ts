import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from '../entities/tag.entity';
import { RestaurantEntity } from '../entities/restaurant.entity';

@Injectable()
export class TagsAdminService {
  constructor(
    @InjectRepository(TagEntity) private readonly tagsRepo: Repository<TagEntity>,
    @InjectRepository(RestaurantEntity) private readonly restaurantsRepo: Repository<RestaurantEntity>,
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
    await this.tagsRepo.manager.query(
      `INSERT INTO restaurant_tags (restaurant_slug, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [restaurant.slug, name],
    );

    return tag;
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
}
