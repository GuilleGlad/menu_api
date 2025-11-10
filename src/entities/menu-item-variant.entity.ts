import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';

@Entity('item_variants')
export class MenuItemVariantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  item_id!: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'integer', default: 0 })
  price_cents_delta!: number; // delta from base price (can be negative)

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;
}
