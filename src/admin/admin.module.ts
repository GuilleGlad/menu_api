import { Module } from '@nestjs/common';
import { RestaurantsAdminController } from './restaurants.controller';
import { PublicModule } from '../public/public.module';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { UsersAdminController } from './users.controller';
import { UsersAdminService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './auth.controller';
import { AdminAuthService } from './auth.service';
import { AdminBootstrapService } from './bootstrap.service';

@Module({
  imports: [
    PublicModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      global: false,
      secret: process.env.ADMIN_JWT_SECRET || 'dev-admin-secret',
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [RestaurantsAdminController, UsersAdminController, AdminAuthController],
  providers: [AdminAuthGuard, RolesGuard, UsersAdminService, AdminAuthService, AdminBootstrapService],
})
export class AdminModule {}
