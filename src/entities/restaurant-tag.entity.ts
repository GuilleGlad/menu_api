import { Entity, PrimaryColumn } from 'typeorm';

/**
 * The `restaurant_tags` table in the database stores simple string tags per-restaurant.
 * Schema: restaurant_tags(restaurant_slug varchar, tag varchar)
 * This entity maps that table as a composite primary key of (restaurant_slug, tag).
 * Note: there is no tag_id foreign key in the DB schema; the `tag` column stores the
 * tag name. Do not add relation mappings here.
 */
@Entity('restaurant_tags')
export class RestaurantTagEntity {
  @PrimaryColumn({ name: 'restaurant_slug', type: 'varchar' })
  restaurant_slug!: string;

  @PrimaryColumn({ name: 'tag', type: 'varchar' })
  tag!: string;
}
