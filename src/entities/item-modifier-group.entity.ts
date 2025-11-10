import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { ModifierGroupEntity } from './modifier-group.entity';

@Entity('item_modifier_groups')
@Index(['item_id', 'group_id'], { unique: true })
export class ItemModifierGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  item_id!: string;

  @Column({ type: 'uuid' })
  group_id!: string;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;

  @ManyToOne(() => ModifierGroupEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: ModifierGroupEntity;
}
