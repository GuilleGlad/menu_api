import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MenuSectionEntity } from './menu-section.entity';

@Entity('menu_items')
export class MenuItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  section_id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer', default: 0 })
  price_cents!: number;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => MenuSectionEntity, (s) => s.items, { onDelete: 'CASCADE' })
  section?: MenuSectionEntity;
}
