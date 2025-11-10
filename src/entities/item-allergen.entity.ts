import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { AllergenEntity } from './allergen.entity';

@Entity('item_allergens')
@Index(['item_id', 'allergen_id'], { unique: true })
export class ItemAllergenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  item_id!: string;

  @Column({ type: 'uuid' })
  allergen_id!: string;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;

  @ManyToOne(() => AllergenEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'allergen_id' })
  allergen?: AllergenEntity;
}
