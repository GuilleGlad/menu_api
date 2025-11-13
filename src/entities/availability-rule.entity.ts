import { Column, Entity, PrimaryGeneratedColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';

@Entity('availability_rules')
export class AvailabilityRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  restaurant_id!: string;

  @Column({ type: 'varchar', length: 255 })
  target_type!: string; // e.g., 'restaurant', 'menu', 'item'

  @Column({ type: 'uuid' })
  target_id!: string; // ID of the target entity 

  // Day of week 0-6 (Sun=0), null means applies to any day when using date range fields
  @Column({ type: 'integer', nullable: true })
  day_of_week!: number | null; // 0=Sun, 1=Mon, ..., 6=Sat

  // Minutes since midnight [0, 1440)
  @Column({ type: 'integer', default: 0 })
  start_time!: number | null;

  @Column({ type: 'integer', default: 1440 })
  end_time!: number | null;

  // Optional date range boundaries (inclusive)
  @Column({ type: 'date', nullable: true })
  start_date!: string | null;

  @Column({ type: 'date', nullable: true })
  end_date!: string | null;

  @OneToOne(() => RestaurantEntity, (restaurant) => restaurant.availability_rules)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: RestaurantEntity;
}
