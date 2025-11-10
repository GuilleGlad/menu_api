import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ModifierEntity } from './modifier.entity';

@Entity('modifier_groups')
export class ModifierGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'boolean', default: false })
  required!: boolean;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => ModifierEntity, (m) => m.group)
  modifiers?: ModifierEntity[];
}
