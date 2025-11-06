export class CreateSessionDto {
  restaurant_slug!: string;
  table_code?: string;
  channel!: 'dine-in' | 'takeaway' | 'delivery';
  locale?: string;
}
