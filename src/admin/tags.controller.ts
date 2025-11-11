import { Body, Controller, Post, Get, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TagsAdminService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Roles } from 'src/auth/roles.decorator';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class TagsAdminController {
  constructor(private readonly service: TagsAdminService) {}

  @Get('restaurants/:restaurant_id/tags')
  @Roles('admin')
  listRestaurantTags(@Param('restaurant_id') restaurantId: string) {
    return this.service.listRestaurantTags(restaurantId);
  }

  @Post('restaurants/:restaurant_id/tags')
  @Roles('admin')
  createRestaurantTag(@Param('restaurant_id') restaurantId: string, @Body() body: CreateTagDto) {
    return this.service.createRestaurantTag(restaurantId, body.code ?? null, body.name);
  }

  @Patch('tags/:tag_id')
  @Roles('admin')
  updateTag(@Param('tag_id') tagId: string, @Body() body: UpdateTagDto) {
    return this.service.updateTag(tagId, body as any);
  }

  @Delete('tags/:tag_id')
  @Roles('admin')
  deleteTag(@Param('tag_id') tagId: string) {
    return this.service.deleteTag(tagId);
  }
}
