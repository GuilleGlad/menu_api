import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuQueryDto } from './dto/menu-query.dto';
import { MenuSearchQueryDto } from './dto/search-query.dto';
import {
  allergensData,
  menusData,
  tagsByRestaurantData,
  Allergen,
} from '../data/mock';
import { RestaurantEntity } from '../entities/restaurant.entity';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurantsRepo: Repository<RestaurantEntity>,
  ) {}

  private allergens: Allergen[] = allergensData;

  private tagsByRestaurant: Record<string, string[]> = tagsByRestaurantData;

  // Minimal menu model resolved for front
  private menus: Record<string, any> = menusData;

  async listRestaurants() {
    const rows = await this.restaurantsRepo.find({
      select: ['id', 'name', 'slug', 'city', 'logo'],
      order: { name: 'ASC' },
    });
    return rows;
  }

  // Admin-side helpers (CRUD) ---------------------------------------------
  adminListRestaurants() {
    return this.restaurantsRepo.find({ order: { name: 'ASC' } });
  }

  adminGetRestaurantById(id: string) {
    return this.restaurantsRepo.findOne({ where: { id } });
  }

  adminCreateRestaurant(data: Partial<RestaurantEntity>) {
    const name = data.name || 'Unnamed';
    const slug = data.slug || this.slugify(name);
    const entity = this.restaurantsRepo.create({
      name,
      slug,
      city: data.city ?? null,
      logo: data.logo ?? null,
      info: data.info ?? null,
    });
    return this.restaurantsRepo.save(entity);
  }

  async adminUpdateRestaurant(id: string, patch: Partial<RestaurantEntity>) {
    const current = await this.restaurantsRepo.findOne({ where: { id } });
    if (!current) return null;
    const updated = {
      ...current,
      ...patch,
      slug: patch.slug ?? current.slug,
    } as RestaurantEntity;
    await this.restaurantsRepo.save(updated);
    return updated;
  }

  async adminDeleteRestaurant(id: string) {
    const res = await this.restaurantsRepo.delete({ id });
    return (res.affected ?? 0) > 0;
  }

  private slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async getRestaurantBySlug(slug: string) {
    const found = await this.restaurantsRepo.findOne({ where: { slug } });
    if (!found) return { error: 'not_found' };
    return {
      id: found.id,
      name: found.name,
      slug: found.slug,
      city: found.city,
      logo: found.logo,
      info: found.info,
      hours: {
        monday: '09:00-22:00',
        tuesday: '09:00-22:00',
      },
    };
  }

  getMenuForFront(restaurant_slug: string, query: MenuQueryDto) {
    const menu = this.menus[restaurant_slug];
    if (!menu) return { error: 'menu_not_found' };

    // apply expand param (simple implementation)
    const expand = query.expand || 'sections,items,variants,tags,allergens';
    const expandSet = new Set(expand.split(',').map((s) => s.trim()));

    const result: any = { id: menu.id, published_at: menu.published_at };
    if (expandSet.has('sections') || expandSet.has('all')) {
      result.sections = menu.sections.map((sec) => {
        const secCopy: any = { id: sec.id, name: sec.name };
        if (expandSet.has('items') || expandSet.has('all')) {
          secCopy.items = sec.items.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description,
            price: it.price,
            tags:
              expandSet.has('tags') || expandSet.has('all')
                ? it.tags
                : undefined,
            allergens:
              expandSet.has('allergens') || expandSet.has('all')
                ? it.allergens
                : undefined,
            variants:
              expandSet.has('variants') || expandSet.has('all')
                ? it.variants
                : undefined,
          }));
        }
        return secCopy;
      });
    }

    // include_availability and at are acknowledged but not implemented in depth in this mock
    if (
      query.include_availability === 'true' ||
      query.include_availability === true
    ) {
      result.availability = { available: true };
    }

    if (query.locale) result.locale = query.locale;

    return result;
  }

  searchMenuItems(restaurant_slug: string, query: MenuSearchQueryDto) {
    const menu = this.menus[restaurant_slug];
    console.log(query);
    if (!menu) return { error: 'menu_not_found' };

    const q = (query.q || '').toLowerCase();
    const sectionId = query.section_id;
    const tags = query.tags
      ? Array.isArray(query.tags)
        ? query.tags
        : query.tags.split(',')
      : [];

    const items: any[] = [];
    for (const sec of menu.sections) {
      if (sectionId && sec.id !== sectionId) continue;
      for (const it of sec.items) {
        const hay = (it.name + ' ' + (it.description || '')).toLowerCase();
        const matchesQ = !q || hay.includes(q);
        const matchesTags =
          tags.length === 0 || tags.every((t) => it.tags.includes(t));
        if (matchesQ && matchesTags)
          items.push({ ...it, section: { id: sec.id, name: sec.name } });
      }
    }

    return { total: items.length, items };
  }

  listAllergens() {
    return this.allergens;
  }

  listTags(restaurant_slug?: string) {
    if (restaurant_slug)
      return (this.tagsByRestaurant[restaurant_slug] || []).map((t, i) => ({
        id: `t_${i + 1}`,
        name: t,
      }));
    // global unique tags
    const uniq = new Set<string>();
    Object.values(this.tagsByRestaurant).forEach((arr) =>
      arr.forEach((t) => uniq.add(t)),
    );
    return Array.from(uniq).map((t, i) => ({ id: `tg_${i + 1}`, name: t }));
  }
}
