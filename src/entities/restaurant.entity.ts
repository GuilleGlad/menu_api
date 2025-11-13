import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AvailabilityRuleEntity } from './availability-rule.entity';

@Entity('restaurants')
export class RestaurantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logo?: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  info?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => AvailabilityRuleEntity, (rule) => rule.restaurant_id)
  availability_rules?: AvailabilityRuleEntity[];
}
