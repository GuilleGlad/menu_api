import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PublicModule } from './public/public.module';
import { ClientModule } from './client/client.module';
import { PricingModule } from './pricing/pricing.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // Database ORM configuration (PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '12345',
      database: 'postgresV2',
      autoLoadEntities: true,
      synchronize: false, // Using existing schema in 'postgres' DB; disable auto sync to avoid FK/PK conflicts
      retryAttempts: 3,
      retryDelay: 2000,
    }),
    PublicModule,
    ClientModule,
    PricingModule,
    OrdersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
