import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  restaurant_id!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 32, nullable: true})
  icon_url!: string | null;

//   @CreateDateColumn({ type: 'timestamptz' })
//   created_at!: Date;

//   @UpdateDateColumn({ type: 'timestamptz' })
//   updated_at!: Date;
}
