import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ModifierGroupEntity } from './modifier-group.entity';

@Entity('modifiers')
export class ModifierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  group_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'integer', default: 0 })
  price_cents!: number;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => ModifierGroupEntity, (g) => g.modifiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: ModifierGroupEntity;
}
