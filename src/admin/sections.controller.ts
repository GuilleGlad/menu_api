import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminMenuSectionsService } from './sections.service';
import { CreateMenuSectionDto } from './dto/create-menu-section.dto';
import { UpdateMenuSectionDto } from './dto/update-menu-section.dto';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class SectionsAdminController {
  constructor(private readonly sections: AdminMenuSectionsService) {}

  @Post('menus/:menu_id/sections')
  @Roles('admin')
  createSection(@Param('menu_id') id: string, @Body() body: CreateMenuSectionDto) {
    this.validateUuid(id, 'menu_id');
    return this.sections.createSection(id, body);
  }

  @Get('sections/:section_id')
  @Roles('admin')
  getSection(@Param('section_id') id: string) {
    this.validateUuid(id, 'section_id');
    return this.sections.getSection(id);
  }

  @Patch('sections/:section_id')
  @Roles('admin')
  updateSection(@Param('section_id') id: string, @Body() body: UpdateMenuSectionDto) {
    this.validateUuid(id, 'section_id');
    return this.sections.updateSection(id, body);
  }

  @Delete('sections/:section_id')
  @Roles('admin')
  deleteSection(@Param('section_id') id: string) {
    this.validateUuid(id, 'section_id');
    return this.sections.deleteSection(id);
  }

  @Post('sections/:section_id/items/reorder')
  @Roles('admin')
  reorderItems(@Param('section_id') id: string, @Body() body: { item_ids: string[] }) {
    this.validateUuid(id, 'section_id');
    return this.sections.reorderItems(id, body?.item_ids || []);
  }

  @Post('sections/:section_id/items/:item_id')
  @Roles('admin')
  addItemToSection(@Param('section_id') sectionId: string, @Param('item_id') itemId: string) {
    this.validateUuid(sectionId, 'section_id');
    this.validateUuid(itemId, 'item_id');
    return this.sections.addItemToSection(sectionId, itemId);
  }

  @Delete('sections/:section_id/items/:item_id')
  @Roles('admin')
  removeItemFromSection(@Param('section_id') sectionId: string, @Param('item_id') itemId: string) {
    this.validateUuid(sectionId, 'section_id');
    this.validateUuid(itemId, 'item_id');
    return this.sections.removeItemFromSection(sectionId, itemId);
  }

  private validateUuid(value: string, field: string) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(value)) throw new BadRequestException(`${field}_invalid`);
  }
}
