export class UpdateOrderDto {
  items?: Array<{ item_id: string; variant_id?: string; modifiers?: string[]; quantity?: number; note?: string }>;
  tip?: number;
  coupon_code?: string;
  customer?: { name?: string; phone?: string };
}
