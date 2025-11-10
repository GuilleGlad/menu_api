import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { TagEntity } from './tag.entity';

@Entity('restaurant_tags')
@Index(['restaurant_id', 'tag_id'], { unique: true })
export class RestaurantTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  restaurant_id!: string;

  @Column({ type: 'uuid' })
  tag_id!: string;

  @ManyToOne(() => RestaurantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag?: TagEntity;
}
