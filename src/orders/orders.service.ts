import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PricingService } from '../pricing/pricing.service';

type OrderStatus = 'draft' | 'open' | 'submitted' | 'preparing' | 'ready' | 'served' | 'canceled';

@Injectable()
export class OrdersService {
  private orders: Record<string, any> = {};

  constructor(private readonly pricing: PricingService) {}

  private generateId() {
    return 'order_' + require('crypto').randomBytes(8).toString('hex');
  }

  createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) throw new BadRequestException('items_required');

    const order_id = this.generateId();
    const created_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 min draft expiry

    // compute pricing via PricingService
    const pricingReq = {
      restaurant_id: dto.restaurant_id,
      items: dto.items.map((it) => ({ item_id: it.item_id, variant_id: it.variant_id, modifiers: it.modifiers || [], quantity: it.quantity })),
      tip: dto.tip,
      coupon_code: dto.coupon_code,
    };

    const pricing = this.pricing.computeQuote(pricingReq as any);

    const order = {
      order_id,
      status: 'draft' as OrderStatus,
      restaurant_id: dto.restaurant_id,
      channel: dto.channel,
      table_id: dto.table_id,
      customer: dto.customer || {},
      items: dto.items,
      tip: dto.tip,
      coupon_code: dto.coupon_code,
      pricing,
      created_at,
      updated_at: created_at,
      expires_at,
      history: [{ status: 'draft', at: created_at }],
    };

    this.orders[order_id] = order;
    return { order_id: order.order_id, status: order.status, pricing: order.pricing, expires_at: order.expires_at };
  }

  getOrder(order_id: string) {
    const o = this.orders[order_id];
    if (!o) throw new NotFoundException();
    return o;
  }

  updateOrder(order_id: string, dto: UpdateOrderDto) {
    const o = this.orders[order_id];
    if (!o) throw new NotFoundException();
    if (o.status !== 'draft') throw new BadRequestException('only_draft_editable');

    if (dto.items) o.items = dto.items as any;
    if (dto.tip !== undefined) o.tip = dto.tip;
    if (dto.coupon_code !== undefined) o.coupon_code = dto.coupon_code;
    if (dto.customer) o.customer = dto.customer;

    // recompute pricing
    const pricingReq = {
      restaurant_id: o.restaurant_id,
      items: o.items.map((it: any) => ({ item_id: it.item_id, variant_id: it.variant_id, modifiers: it.modifiers || [], quantity: it.quantity })),
      tip: o.tip,
      coupon_code: o.coupon_code,
    };
    o.pricing = this.pricing.computeQuote(pricingReq as any);
    o.updated_at = new Date().toISOString();
    o.history.push({ status: 'draft', at: o.updated_at, note: 'updated' });

    return o;
  }

  submitOrder(order_id: string) {
    const o = this.orders[order_id];
    if (!o) throw new NotFoundException();
    if (o.status !== 'draft') throw new BadRequestException('only_draft_can_submit');

    o.status = 'submitted';
    o.submitted_at = new Date().toISOString();
    o.updated_at = o.submitted_at;
    o.history.push({ status: 'submitted', at: o.submitted_at });

    return { order_id: o.order_id, status: o.status };
  }

  cancelOrder(order_id: string) {
    const o = this.orders[order_id];
    if (!o) throw new NotFoundException();
    if (o.status === 'canceled' || o.status === 'served') throw new BadRequestException('cannot_cancel');

    o.status = 'canceled';
    o.canceled_at = new Date().toISOString();
    o.updated_at = o.canceled_at;
    o.history.push({ status: 'canceled', at: o.canceled_at });
    return { order_id: o.order_id, status: o.status };
  }

  applyCoupon(order_id: string, coupon_code: string) {
    const o = this.orders[order_id];
    console.log(o.status);
    if (!o) throw new NotFoundException();
    if (o.status !== 'draft') throw new BadRequestException('only_draft_editable');
    o.coupon_code = coupon_code;
    // recompute pricing
    const pricingReq = {
      restaurant_id: o.restaurant_id,
      items: o.items.map((it: any) => ({ item_id: it.item_id, variant_id: it.variant_id, modifiers: it.modifiers || [], quantity: it.quantity })),
      tip: o.tip,
      coupon_code: o.coupon_code,
    };
    o.pricing = this.pricing.computeQuote(pricingReq as any);
    o.updated_at = new Date().toISOString();
    o.history.push({ status: 'draft', at: o.updated_at, note: 'coupon_applied' });
    return o;
  }

  updateTip(order_id: string, tip: number) {
    const o = this.orders[order_id];
    if (!o) throw new NotFoundException();
    if (o.status !== 'draft') throw new BadRequestException('only_draft_editable');
    o.tip = tip;
    const pricingReq = {
      restaurant_id: o.restaurant_id,
      items: o.items.map((it: any) => ({ item_id: it.item_id, variant_id: it.variant_id, modifiers: it.modifiers || [], quantity: it.quantity })),
      tip: o.tip,
      coupon_code: o.coupon_code,
    };
    o.pricing = this.pricing.computeQuote(pricingReq as any);
    o.updated_at = new Date().toISOString();
    o.history.push({ status: 'draft', at: o.updated_at, note: 'tip_updated' });
    return o;
  }

  listOrders(filter: { status?: string; restaurant_id?: string; table_id?: string }) {
    const res = Object.values(this.orders).filter((o: any) => {
      if (filter.status && o.status !== filter.status) return false;
      if (filter.restaurant_id && o.restaurant_id !== filter.restaurant_id) return false;
      if (filter.table_id && o.table_id !== filter.table_id) return false;
      return true;
    });
    return res;
  }
}
