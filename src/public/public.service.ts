import { Injectable } from '@nestjs/common';
import { MenuQueryDto } from './dto/menu-query.dto';
import { MenuSearchQueryDto } from './dto/search-query.dto';

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  city: string;
  logo?: string;
  info?: string;
};

type Allergen = { id: string; code: string; name: string; icon?: string };

@Injectable()
export class PublicService {
  private restaurants: Restaurant[] = [
    {
      id: 'r_1',
      name: 'La Buena Mesa',
      slug: 'la-buena-mesa',
      city: 'Madrid',
      logo: '/assets/logos/la-buena-mesa.png',
      info: 'Restaurante de cocina mediterránea',
    },
    {
      id: 'r_2',
      name: 'Green Bites',
      slug: 'green-bites',
      city: 'Barcelona',
      logo: '/assets/logos/green-bites.png',
      info: 'Opciones veganas y vegetarianas',
    },
  ];

  private allergens: Allergen[] = [
    { id: 'a1', code: 'GLUTEN', name: 'Gluten', icon: '🌾' },
    { id: 'a2', code: 'DAIRY', name: 'Lácteos', icon: '🥛' },
    { id: 'a3', code: 'NUTS', name: 'Frutos secos', icon: '🥜' },
  ];

  private tagsByRestaurant: Record<string, string[]> = {
    'la-buena-mesa': ['especial', 'fuerte', 'sin-gluten'],
    'green-bites': ['vegano', 'sin-gluten', 'saludable'],
  };

  // Minimal menu model resolved for front
  private menus: Record<string, any> = {
    'la-buena-mesa': {
      id: 'm_r1_v1',
      published_at: new Date().toISOString(),
      sections: [
        {
          id: 's1',
          name: 'Entrantes',
          items: [
            {
              id: 'i1',
              name: 'Ensalada de temporada',
              description: 'Lechuga, tomate, vinagreta',
              price: 6.5,
              tags: ['saludable'],
              allergens: ['DAIRY'],
              variants: [],
            },
          ],
        },
      ],
    },
    'green-bites': {
      id: 'm_r2_v1',
      published_at: new Date().toISOString(),
      sections: [
        {
          id: 's1',
          name: 'Bocadillos',
          items: [
            {
              id: 'i2',
              name: 'Wrap vegano',
              description: 'Relleno con hummus y verduras',
              price: 7.0,
              tags: ['vegano'],
              allergens: [],
              variants: [],
            },
          ],
        },
      ],
    },
  };

  listRestaurants() {
    // return only basic fields
    return this.restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      city: r.city,
      logo: r.logo,
    }));
  }

  // Admin-side helpers (CRUD) ---------------------------------------------
  adminListRestaurants() {
    return this.restaurants;
  }

  adminGetRestaurantById(id: string) {
    return this.restaurants.find((r) => r.id === id) || null;
  }

  adminCreateRestaurant(data: Partial<Restaurant>) {
    const id = this.genId();
    const restaurant: Restaurant = {
      id,
      name: data.name || 'Unnamed',
      slug: data.slug || this.slugify(data.name || id),
      city: data.city || '',
      logo: data.logo,
      info: data.info,
    };
    this.restaurants.push(restaurant);
    return restaurant;
  }

  adminUpdateRestaurant(id: string, patch: Partial<Restaurant>) {
    const idx = this.restaurants.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const current = this.restaurants[idx];
    const updated: Restaurant = {
      ...current,
      ...patch,
      slug: patch.slug ?? current.slug,
    };
    this.restaurants[idx] = updated;
    return updated;
  }

  adminDeleteRestaurant(id: string) {
    const idx = this.restaurants.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.restaurants.splice(idx, 1);
    return true;
  }

  private genId() {
    return 'r_' + Math.random().toString(36).slice(2, 8);
  }

  private slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  getRestaurantBySlug(slug: string) {
    const found = this.restaurants.find((r) => r.slug === slug);
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
            tags: expandSet.has('tags') || expandSet.has('all') ? it.tags : undefined,
            allergens: expandSet.has('allergens') || expandSet.has('all') ? it.allergens : undefined,
            variants: expandSet.has('variants') || expandSet.has('all') ? it.variants : undefined,
          }));
        }
        return secCopy;
      });
    }

    // include_availability and at are acknowledged but not implemented in depth in this mock
    if (query.include_availability === 'true' || query.include_availability === true) {
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
    const tags = query.tags ? (Array.isArray(query.tags) ? query.tags : query.tags.split(',')) : [];

    const items: any[] = [];
    for (const sec of menu.sections) {
      if (sectionId && sec.id !== sectionId) continue;
      for (const it of sec.items) {
        const hay = (it.name + ' ' + (it.description || '')).toLowerCase();
        const matchesQ = !q || hay.includes(q);
        const matchesTags = tags.length === 0 || tags.every((t) => it.tags.includes(t));
        if (matchesQ && matchesTags) items.push({ ...it, section: { id: sec.id, name: sec.name } });
      }
    }

    return { total: items.length, items };
  }

  listAllergens() {
    return this.allergens;
  }

  listTags(restaurant_slug?: string) {
    if (restaurant_slug) return (this.tagsByRestaurant[restaurant_slug] || []).map((t, i) => ({ id: `t_${i + 1}`, name: t }));
    // global unique tags
    const uniq = new Set<string>();
    Object.values(this.tagsByRestaurant).forEach((arr) => arr.forEach((t) => uniq.add(t)));
    return Array.from(uniq).map((t, i) => ({ id: `tg_${i + 1}`, name: t }));
  }
}
