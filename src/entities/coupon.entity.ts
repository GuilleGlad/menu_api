import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  // Percentage discount e.g. 0.10 for 10% (exclusive of amount_cents)
  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true })
  percent!: string | null;

  // Absolute discount in cents if provided instead of percent
  @Column({ type: 'integer', nullable: true })
  amount_cents!: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  starts_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
