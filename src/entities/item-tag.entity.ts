import { Column, Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { TagEntity } from './tag.entity';

@Entity('item_tags')
export class ItemTagEntity {
  // Composite primary key: (item_id, tag_id)
  @PrimaryColumn('uuid')
  item_id!: string;

  @PrimaryColumn('uuid')
  tag_id!: string;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag?: TagEntity;
}
