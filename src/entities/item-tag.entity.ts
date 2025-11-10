import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { TagEntity } from './tag.entity';

@Entity('item_tags')
@Index(['item_id', 'tag_id'], { unique: true })
export class ItemTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  item_id!: string;

  @Column({ type: 'uuid' })
  tag_id!: string;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag?: TagEntity;
}
