import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ClientAuthGuard } from '../auth/client-auth.guard';

@Controller({ path: 'orders', version: '1' })
@UseGuards(ClientAuthGuard)
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.svc.createOrder(body);
  }

  @Get(':order_id')
  get(@Param('order_id') order_id: string) {
    return this.svc.getOrder(order_id);
  }

  @Patch(':order_id')
  patch(@Param('order_id') order_id: string, @Body() body: UpdateOrderDto) {
    return this.svc.updateOrder(order_id, body);
  }

  @Post(':order_id/submit')
  submit(@Param('order_id') order_id: string) {
    return this.svc.submitOrder(order_id);
  }

  @Post(':order_id/cancel')
  cancel(@Param('order_id') order_id: string) {
    return this.svc.cancelOrder(order_id);
  }

  @Post(':order_id/apply-coupon')
  applyCoupon(@Param('order_id') order_id: string, @Body() body: { coupon_code: string }) {
    return this.svc.applyCoupon(order_id, body.coupon_code);
  }

  @Post(':order_id/tip')
  tip(@Param('order_id') order_id: string, @Body() body: { tip: number }) {
    return this.svc.updateTip(order_id, body.tip);
  }

  @Get()
  list(@Query('status') status?: string, @Query('restaurant_id') restaurant_id?: string, @Query('table_id') table_id?: string) {
    return this.svc.listOrders({ status, restaurant_id, table_id });
  }
}
