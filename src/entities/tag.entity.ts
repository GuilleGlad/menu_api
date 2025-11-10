import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Optional restaurant scoping; if null it's global
  @Column({ type: 'uuid', nullable: true })
  restaurant_id!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
