import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tax_rates')
export class TaxRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  restaurant_id!: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  rate_percent!: string; // store decimal as string from PG

  @Column({type: 'boolean', default: true })
  included_in_price!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  valid_from!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  valid_to!: Date | null;
}
