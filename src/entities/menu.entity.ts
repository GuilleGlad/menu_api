import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MenuSectionEntity } from './menu-section.entity';

@Entity('menus')
export class MenuEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'restaurant_id', nullable: true })
  restaurant_id!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'restaurant_slug', nullable: true })
  restaurant_slug!: string | null;

  @Column({ type: 'text', default: 'Menu' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  is_published!: boolean;

  @Column({ type: 'date', nullable: true })
  valid_from!: Date | null;

  @Column({ type: 'date', nullable: true })
  valid_to!: Date | null;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updated_at!: Date;

  @Column({ type: 'jsonb', nullable: true })
  content!: any;

  @Column({ type: 'timestamptz', nullable: true })
  published_at!: Date | null;

  @OneToMany(() => MenuSectionEntity, (s: MenuSectionEntity) => s.menu)
  sections?: MenuSectionEntity[];
}
