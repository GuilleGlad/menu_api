-- Merge-friendly PostgreSQL schema for Restaurant Menu API
-- Purpose: adapt existing tables in the 'postgres' database and create missing ones
-- Safe to run multiple times; uses IF EXISTS/IF NOT EXISTS and guarded DO blocks
-- Generated: 2025-11-07

BEGIN;

-- 0) Prerequisites
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) USERS TABLE -------------------------------------------------------------
-- Create if absent
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(50)  NOT NULL DEFAULT 'client',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ensure required columns and constraints when users already exists
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS username       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_hash  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS role           VARCHAR(50)  DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ  DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ  DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'users' AND c.conname = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- 2) RESTAURANTS TABLE ------------------------------------------------------
-- Create if absent
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

-- Ensure columns/constraints if table already exists
ALTER TABLE IF EXISTS restaurants
  ADD COLUMN IF NOT EXISTS name        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS slug        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS logo        VARCHAR(512),
  ADD COLUMN IF NOT EXISTS info        VARCHAR(1024),
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ  DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ  DEFAULT NOW();

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

-- Try to ensure id default to uuid (won't fail if type mismatch)
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE restaurants ALTER COLUMN id SET DEFAULT uuid_generate_v4()';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

-- 3) ALLERGENS --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergens (
  id    VARCHAR(50) PRIMARY KEY,
  code  VARCHAR(50) UNIQUE NOT NULL,
  name  VARCHAR(255) NOT NULL,
  icon  VARCHAR(32)
);

-- 4) RESTAURANT TAGS --------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_tags (
  restaurant_slug VARCHAR(255) NOT NULL REFERENCES restaurants(slug) ON DELETE CASCADE,
  tag             VARCHAR(100) NOT NULL,
  PRIMARY KEY (restaurant_slug, tag)
);
CREATE INDEX IF NOT EXISTS idx_restaurant_tags_slug ON restaurant_tags(restaurant_slug);

-- 5) MENUS ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menus (
  id               VARCHAR(100) PRIMARY KEY,
  restaurant_slug  VARCHAR(255) NOT NULL REFERENCES restaurants(slug) ON DELETE CASCADE,
  content          JSONB NOT NULL,
  published_at     TIMESTAMPTZ
);

-- If a legacy menus table exists with different types or missing columns, adapt safely
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menus'
  ) THEN
    -- Ensure restaurant_slug column exists; if legacy restaurant_id exists, try to backfill
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'menus' AND column_name = 'restaurant_slug'
    ) THEN
      EXECUTE 'ALTER TABLE public.menus ADD COLUMN restaurant_slug VARCHAR(255)';
      -- Backfill from restaurant_id if available
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'menus' AND column_name = 'restaurant_id'
      ) THEN
        BEGIN
          EXECUTE 'UPDATE public.menus m SET restaurant_slug = r.slug FROM public.restaurants r WHERE m.restaurant_id::text = r.id::text AND m.restaurant_slug IS NULL';
        EXCEPTION WHEN others THEN
          NULL;
        END;
      END IF;
      -- Add FK if not present
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          WHERE t.relname = 'menus' AND c.conname = 'fk_menus_restaurant_slug'
        ) THEN
          EXECUTE 'ALTER TABLE public.menus ADD CONSTRAINT fk_menus_restaurant_slug FOREIGN KEY (restaurant_slug) REFERENCES public.restaurants(slug) ON DELETE CASCADE';
        END IF;
      EXCEPTION WHEN others THEN
        NULL;
      END;
    END IF;

    -- Ensure content column exists and is JSONB
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'menus' AND column_name = 'content'
    ) THEN
      BEGIN
        EXECUTE 'ALTER TABLE public.menus ALTER COLUMN content TYPE JSONB USING content::jsonb';
      EXCEPTION WHEN others THEN
        -- Ignore conversion errors to keep merge idempotent; manual fix may be needed
        NULL;
      END;
    ELSE
      EXECUTE 'ALTER TABLE public.menus ADD COLUMN content JSONB NOT NULL DEFAULT ''{}''::jsonb';
      EXECUTE 'ALTER TABLE public.menus ALTER COLUMN content DROP DEFAULT';
    END IF;

    -- Ensure published_at column exists and is TIMESTAMPTZ
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'menus' AND column_name = 'published_at'
    ) THEN
      BEGIN
        EXECUTE 'ALTER TABLE public.menus ALTER COLUMN published_at TYPE TIMESTAMPTZ USING published_at::timestamptz';
      EXCEPTION WHEN others THEN
        NULL;
      END;
    ELSE
      EXECUTE 'ALTER TABLE public.menus ADD COLUMN published_at TIMESTAMPTZ';
    END IF;
  END IF;
END $$;

-- Create index on menus(restaurant_slug) only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'menus' AND column_name = 'restaurant_slug'
  ) THEN
    BEGIN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_menus_restaurant_slug ON public.menus(restaurant_slug)';
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
END $$;

-- 6) TRIGGERS (updated_at maintenance) --------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop/create pattern to be idempotent
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

-- Optional: seed default admin for dev
INSERT INTO users (username, email, password_hash, role)
VALUES ('owner', 'owner@test.com', 'owner123', 'admin')
ON CONFLICT (email) DO NOTHING;
