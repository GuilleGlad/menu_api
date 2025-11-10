import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn, OneToMany } from 'typeorm';
import { MenuEntity } from './menu.entity';
import { MenuItemEntity } from './menu-item.entity';

@Entity('menu_sections')
export class MenuSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  menu_id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => MenuEntity, (m) => m.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu?: MenuEntity;

  // optional reverse relation to satisfy MenuItemEntity's ManyToOne callback signature
  @OneToMany(() => MenuItemEntity, (i) => i.section)
  items?: MenuItemEntity[];
}
