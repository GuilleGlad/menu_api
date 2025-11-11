import { Module } from '@nestjs/common';
import { RestaurantsAdminController } from './restaurants.controller';
import { MenusAdminController } from './menus.controller';
import { PublicModule } from '../public/public.module';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { RestaurantEntity } from '../entities/restaurant.entity';
import { MenuEntity } from '../entities/menu.entity';
import { MenuSectionEntity } from '../entities/menu-section.entity';
import { MenuItemEntity } from '../entities/menu-item.entity';
import { UsersAdminController } from './users.controller';
import { UsersAdminService } from './users.service';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './auth.controller';
import { AdminAuthService } from './auth.service';
import { AdminBootstrapService } from './bootstrap.service';
import { AdminOidcService } from './oidc.service';
import { AdminDataSeedService } from './data-seed.service';
import { AdminDataController } from './data.controller';
import { AdminMenusService } from './menus.service';
import { AdminMenuSectionsService } from './sections.service';
import { SectionsAdminController } from './sections.controller';
import { MenuItemsService } from './items.service';
import { MenuItemSectionEntity } from '../entities/menu-item-section.entity';

@Module({
  imports: [
    PublicModule,
  TypeOrmModule.forFeature([UserEntity, RestaurantEntity, MenuEntity, MenuSectionEntity, MenuItemEntity,MenuItemSectionEntity]),
    JwtModule.register({
      global: false,
      secret: process.env.ADMIN_JWT_SECRET || 'dev-admin-secret',
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [
    RestaurantsAdminController,
    MenusAdminController,
    UsersAdminController,
    AdminAuthController,
    AdminDataController,
    SectionsAdminController,
  ],
  providers: [
    AdminAuthGuard,
    RolesGuard,
    UsersAdminService,
    AdminAuthService,
    AdminBootstrapService,
    AdminOidcService,
    AdminDataSeedService,
    AdminMenusService,
    AdminMenuSectionsService,
    MenuItemsService,
  ],
})
export class AdminModule {}
