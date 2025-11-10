import { Injectable } from '@nestjs/common';
import { PublicService } from '../public/public.service';
import { CreateQuoteDto } from './dto/quote-request.dto';

@Injectable()
export class PricingService {
  constructor(private readonly publicService: PublicService) {}

  async computeQuote(dto: CreateQuoteDto) {
    // find restaurant by id
    console.log(dto);
    const restaurants = await this.publicService.listRestaurants();
    const rest = restaurants.find((r) => r.id === dto.restaurant_id);
    if (!rest) return { error: 'restaurant_not_found' };

    // get expanded menu
    const menu = this.publicService.getMenuForFront(rest.slug, {
      expand: 'sections,items,variants,tags,allergens',
    });
    if (!menu || !menu.sections) return { error: 'menu_not_found' };

    const lines: any[] = [];
    const warnings: string[] = [];
    let subtotal = 0;

    const findItem = (itemId: string) => {
      for (const sec of menu.sections) {
        if (!sec.items) continue;
        const it = sec.items.find((i: any) => i.id === itemId);
        if (it) return { item: it, section: { id: sec.id, name: sec.name } };
      }
      return null;
    };

    for (const reqItem of dto.items || []) {
      const found = findItem(reqItem.item_id);
      if (!found) {
        warnings.push(`item_not_found:${reqItem.item_id}`);
        continue;
      }

      const basePrice = Number(found.item.price || 0);
      // variants/modifiers price adjustments are not implemented in mock; assume same price
      const quantity = Number(reqItem.quantity || 1);
      const line_total = +(basePrice * quantity).toFixed(2);
      subtotal += line_total;

      const validated = {
        item_id: found.item.id,
        name: found.item.name,
        description: found.item.description,
        section: found.section,
        quantity,
        unit_price: basePrice,
        modifiers: reqItem.modifiers || [],
        variant_id: reqItem.variant_id,
      };

      lines.push({ ...validated, line_total });
    }

    subtotal = +subtotal.toFixed(2);

    // apply coupon simple rules
    let coupon_discount = 0;
    if (dto.coupon_code === 'DISCOUNT10') {
      coupon_discount = +(subtotal * 0.1).toFixed(2);
    }

    // taxes (mock): 10% VAT on subtotal after coupon
    const taxable = Math.max(0, subtotal - coupon_discount);
    const taxAmount = +(taxable * 0.1).toFixed(2);

    // service charge mock: 5% of subtotal
    const service_charge = +(subtotal * 0.05).toFixed(2);

    const tip = dto.tip ? +Number(dto.tip).toFixed(2) : 0;

    const total = +(taxable - 0 + taxAmount + service_charge + tip).toFixed(2);

    const taxes = [{ name: 'VAT', amount: taxAmount }];

    return {
      lines,
      subtotal,
      discounts:
        coupon_discount > 0
          ? [{ code: dto.coupon_code, amount: coupon_discount }]
          : undefined,
      taxes,
      service_charge: service_charge || undefined,
      tip: tip || undefined,
      total,
      warnings,
    };
  }
}
