import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  allergensData,
  menusData,
  restaurantsData,
  tagsByRestaurantData,
} from '../data/mock';

@Injectable()
export class AdminDataSeedService {
  private readonly logger = new Logger(AdminDataSeedService.name);
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async seed() {
    try {
      // Ensure UUID generators available and default on id
      await this.dataSource.query(
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      );
      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

      // Ensure restaurants table has required columns and indexes
      await this.dataSource.query(`
        ALTER TABLE IF EXISTS restaurants
        ADD COLUMN IF NOT EXISTS city VARCHAR(255),
        ADD COLUMN IF NOT EXISTS logo VARCHAR(512),
        ADD COLUMN IF NOT EXISTS info VARCHAR(1024);
      `);
      // Ensure unique constraint on slug (needed for FKs and upsert)
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'restaurants' AND c.conname = 'restaurants_slug_key'
          ) THEN
            ALTER TABLE restaurants ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);
          END IF;
        END $$;
      `);
      // Ensure id default
      await this.dataSource.query(`
        DO $$
        BEGIN
          EXECUTE 'ALTER TABLE restaurants ALTER COLUMN id SET DEFAULT uuid_generate_v4()';
        EXCEPTION WHEN others THEN
          -- ignore if column type not uuid; further migration may be needed
          NULL;
        END $$;
      `);

      // Create auxiliary tables if not exist
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS allergens (
          id VARCHAR(50) PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          icon VARCHAR(32)
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS restaurant_tags (
          restaurant_slug VARCHAR(255) NOT NULL REFERENCES restaurants(slug) ON DELETE CASCADE,
          tag VARCHAR(100) NOT NULL,
          PRIMARY KEY (restaurant_slug, tag)
        );
      `);

      // Create menus if not exists (modern schema shape)
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS menus (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
          name TEXT NOT NULL DEFAULT 'Menu',
          description TEXT,
          is_published BOOLEAN NOT NULL DEFAULT false,
          valid_from DATE,
          valid_to DATE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
          restaurant_slug VARCHAR(255),
          content JSONB,
          published_at TIMESTAMPTZ
        );
      `);

      // Ensure legacy installs have required menus columns and types
      // 1) Add restaurant_slug if missing and backfill from restaurant_id when available
      await this.dataSource.query(`
        ALTER TABLE IF EXISTS menus
        ADD COLUMN IF NOT EXISTS restaurant_slug VARCHAR(255);
      `);
      // Ensure restaurant_id column exists (new schema) and is uuid
      await this.dataSource.query(`
        ALTER TABLE IF EXISTS menus
        ADD COLUMN IF NOT EXISTS restaurant_id uuid;
      `);
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menus' AND column_name = 'restaurant_id'
          ) THEN
            UPDATE menus m
            SET restaurant_slug = r.slug
            FROM restaurants r
            WHERE m.restaurant_id = r.id AND (m.restaurant_slug IS NULL OR m.restaurant_slug = '');
          END IF;
        END $$;
      `);
      // Backfill restaurant_id from restaurant_slug if restaurant_id is null
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menus' AND column_name = 'restaurant_slug'
          ) THEN
            UPDATE menus m
            SET restaurant_id = r.id
            FROM restaurants r
            WHERE m.restaurant_slug = r.slug AND m.restaurant_id IS NULL;
          END IF;
        END $$;
      `);
      // 2) Add FK on restaurant_slug if not present
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'menus' AND c.conname = 'menus_restaurant_slug_fkey'
          ) THEN
            ALTER TABLE menus
            ADD CONSTRAINT menus_restaurant_slug_fkey FOREIGN KEY (restaurant_slug)
            REFERENCES restaurants(slug) ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      // Add FK on restaurant_id if not present
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'menus' AND c.conname = 'menus_restaurant_id_fkey'
          ) THEN
            ALTER TABLE menus
            ADD CONSTRAINT menus_restaurant_id_fkey FOREIGN KEY (restaurant_id)
            REFERENCES restaurants(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_menus_restaurant_slug ON menus(restaurant_slug);`,
      );
      await this.dataSource.query(
        `CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON menus(restaurant_id);`,
      );
  // 3) Ensure content column exists and is JSONB
      await this.dataSource.query(`
        ALTER TABLE IF EXISTS menus
        ADD COLUMN IF NOT EXISTS content JSONB;
      `);
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menus' AND column_name = 'content' AND data_type <> 'jsonb'
          ) THEN
            ALTER TABLE menus ALTER COLUMN content TYPE jsonb USING content::jsonb;
          END IF;
        END $$;
      `);
      // 4) Ensure published_at exists and is TIMESTAMPTZ
      await this.dataSource.query(`
        ALTER TABLE IF EXISTS menus
        ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
      `);
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'menus' AND column_name = 'published_at' AND data_type <> 'timestamp with time zone'
          ) THEN
            ALTER TABLE menus ALTER COLUMN published_at TYPE timestamptz USING published_at::timestamptz;
          END IF;
        END $$;
      `);

      // Upsert restaurants using slug as unique key.
      // Use provided UUID from mock when available; otherwise generate a UUID.
      for (const r of restaurantsData) {
        await this.dataSource.query(
          `INSERT INTO restaurants (id, name, slug, city, logo, info)
           VALUES (COALESCE($1::uuid, uuid_generate_v4(), gen_random_uuid()), $2,$3,$4,$5,$6)
           ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, logo=EXCLUDED.logo, info=EXCLUDED.info`,
          [r.id ?? null, r.name, r.slug, r.city ?? null, r.logo ?? null, r.info ?? null],
        );
      }

      // Upsert allergens
      for (const a of allergensData) {
        await this.dataSource.query(
          `INSERT INTO allergens (id, code, name, icon)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, icon=EXCLUDED.icon`,
          [a.id, a.code, a.name, a.icon ?? null],
        );
      }

      // Insert tags
      for (const [slug, tags] of Object.entries(tagsByRestaurantData)) {
        for (const t of tags) {
          await this.dataSource.query(
            `INSERT INTO restaurant_tags (restaurant_slug, tag)
             VALUES ($1,$2)
             ON CONFLICT DO NOTHING`,
            [slug, t],
          );
        }
      }

      // Upsert menus (adapted to expanded schema: restaurant_id, name, description, is_published, sort_order)
      let sortOrder = 0;
      let menusInserted = 0;
      for (const [slug, menu] of Object.entries(menusData)) {
        const restaurantRow = await this.dataSource.query(
          'SELECT id FROM restaurants WHERE slug=$1 LIMIT 1',
          [slug],
        );
        const restaurantId: string | null = restaurantRow[0]?.id || null;
        if (!restaurantId) {
          this.logger.warn(
            `Skipping menu seed for slug="${slug}" (restaurant not found)`,
          );
          continue;
        }
        const name = (menu as any).name || 'Menu principal';
        const description = (menu as any).description || `Menu base para ${slug}`;
        const publishedAt = (menu as any).published_at || null;
        const isPublished = !!publishedAt;
        await this.dataSource.query(
          `INSERT INTO menus (id, restaurant_id, restaurant_slug, name, description, is_published, sort_order, content, published_at)
           VALUES (COALESCE($1::uuid, gen_random_uuid()), $2::uuid, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz)
           ON CONFLICT (id) DO UPDATE SET restaurant_id=EXCLUDED.restaurant_id, restaurant_slug=EXCLUDED.restaurant_slug, name=EXCLUDED.name, description=EXCLUDED.description, is_published=EXCLUDED.is_published, sort_order=EXCLUDED.sort_order, content=EXCLUDED.content, published_at=EXCLUDED.published_at, updated_at=NOW()`,
          [
            (menu as any).id || null,
            restaurantId,
            slug,
            name,
            description,
            isPublished,
            sortOrder++,
            JSON.stringify(menu),
            publishedAt,
          ],
        );
        menusInserted++;
      }

      this.logger.log('Seeded mock data into database (core tables)');
      return {
        ok: true,
        counts: {
          restaurants: restaurantsData.length,
          allergens: allergensData.length,
          tags: Object.values(tagsByRestaurantData).reduce((a, b) => a + b.length, 0),
          menus: menusInserted,
        },
      };
    } catch (err) {
      this.logger.error(
        'Failed seeding mock data',
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
