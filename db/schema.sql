-- PostgreSQL schema for Restaurant Menu API
-- Generated on 2025-11-07
-- Safe to run multiple times (uses IF EXISTS / IF NOT EXISTS where practical)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (admin/client)
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(50)  NOT NULL DEFAULT 'client',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Restaurants (public & admin CRUD)
CREATE TABLE IF NOT EXISTS restaurants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  city        VARCHAR(255),
  logo        VARCHAR(512),
  info        VARCHAR(1024),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Allergen catalog
CREATE TABLE IF NOT EXISTS allergens (
  id    VARCHAR(50) PRIMARY KEY,
  code  VARCHAR(50) UNIQUE NOT NULL,
  name  VARCHAR(255) NOT NULL,
  icon  VARCHAR(32)
);

-- Tags per restaurant (slug FK)
CREATE TABLE IF NOT EXISTS restaurant_tags (
  restaurant_slug VARCHAR(255) NOT NULL REFERENCES restaurants(slug) ON DELETE CASCADE,
  tag             VARCHAR(100) NOT NULL,
  PRIMARY KEY (restaurant_slug, tag)
);

-- Menus (JSONB content)
CREATE TABLE IF NOT EXISTS menus (
  id               VARCHAR(100) PRIMARY KEY,
  restaurant_slug  VARCHAR(255) NOT NULL REFERENCES restaurants(slug) ON DELETE CASCADE,
  content          JSONB NOT NULL,
  published_at     TIMESTAMPTZ
);

-- Item tags: link table for items to tags (stores tag id UUID if available)
CREATE TABLE IF NOT EXISTS item_tags (
    item_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    CONSTRAINT item_tags_pkey PRIMARY KEY (item_id, tag_id),
    CONSTRAINT item_tags_item_id_fkey FOREIGN KEY (item_id)
        REFERENCES public.menu_items (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT item_tags_tag_id_fkey FOREIGN KEY (tag_id)
        REFERENCES public.tags (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);

-- Indexes (optional performance helpers)
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_slug ON menus(restaurant_slug);
CREATE INDEX IF NOT EXISTS idx_restaurant_tags_slug ON restaurant_tags(restaurant_slug);

-- Updated_at trigger function (optional)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers (idempotent pattern: drop then create)
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_restaurants_updated_at ON restaurants;
CREATE TRIGGER trg_restaurants_updated_at
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;

-- Seed default admin (plain password for dev) -- comment out in prod
INSERT INTO users (username, email, password_hash, role)
VALUES ('owner', 'owner@test.com', 'owner123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Availability rules table (idempotent create)
BEGIN;
CREATE TABLE IF NOT EXISTS availability_rules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           VARCHAR(255),
  dow            INTEGER,
  start_min      INTEGER NOT NULL DEFAULT 0,
  end_min        INTEGER NOT NULL DEFAULT 1440,
  start_date     DATE,
  end_date       DATE,
  is_closed      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_availability_rules_restaurant ON availability_rules(restaurant_id);
COMMIT;
