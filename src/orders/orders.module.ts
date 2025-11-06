import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingModule } from '../pricing/pricing.module';
import { ClientModule } from '../client/client.module';
import { ClientAuthGuard } from '../auth/client-auth.guard';

@Module({
  imports: [PricingModule, ClientModule],
  controllers: [OrdersController],
  providers: [OrdersService, ClientAuthGuard],
})
export class OrdersModule {}
