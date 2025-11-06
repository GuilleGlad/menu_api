export class OrderItemDto {
  item_id!: string;
  variant_id?: string;
  modifiers?: string[];
  quantity!: number;
  note?: string;
}

export class CreateOrderDto {
  restaurant_id!: string;
  channel!: 'dine-in' | 'takeaway' | 'delivery';
  table_id?: string;
  customer?: { name?: string; phone?: string };
  items!: OrderItemDto[];
  tip?: number;
  coupon_code?: string;
}
