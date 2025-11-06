export class QuoteItemDto {
  item_id!: string;
  variant_id?: string;
  modifiers?: string[];
  quantity!: number;
}

export class CreateQuoteDto {
  restaurant_id!: string;
  items!: QuoteItemDto[];
  tip?: number;
  coupon_code?: string;
}
