import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { MenuSectionEntity } from './menu-section.entity';

@Entity('menu_item_sections')
@Index(['item_id', 'section_id'], { unique: true })
export class MenuItemSectionEntity {
  // composite primary key: (item_id, section_id)
  @PrimaryColumn({ name: 'item_id', type: 'uuid' })
  item_id!: string;

  @PrimaryColumn({ name: 'section_id', type: 'uuid' })
  section_id!: string;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;

  @ManyToOne(() => MenuSectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section?: MenuSectionEntity;
}
