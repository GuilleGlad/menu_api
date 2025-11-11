import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MenuItemSectionEntity } from './menu-item-section.entity';

@Entity('menu_items')
export class MenuItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurant_id!: string;

  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: "currency_code", type: "char", length: 3})
  currency_code!: string;

  @Column({ name: "is_available", type: "bool", default: true})
  is_available!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  updated_at!: Date;

  @OneToMany(() => MenuItemSectionEntity, (mis) => mis.item)
  @JoinColumn({ name: 'id' })
  items?: MenuItemSectionEntity[];
}
