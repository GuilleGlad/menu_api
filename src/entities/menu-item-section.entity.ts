import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MenuItemEntity } from './menu-item.entity';
import { MenuSectionEntity } from './menu-section.entity';

@Entity('menu_item_sections')
@Index(['item_id', 'section_id'], { unique: true })
export class MenuItemSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  item_id!: string;

  @Column({ type: 'uuid' })
  section_id!: string;

  @ManyToOne(() => MenuItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item?: MenuItemEntity;

  @ManyToOne(() => MenuSectionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section?: MenuSectionEntity;
}
