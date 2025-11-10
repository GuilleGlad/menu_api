import { Body, Controller, Get, Param, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AdminMenusService } from './menus.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { AdminMenuSectionsService } from './sections.service';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class MenusAdminController {
  constructor(
    private readonly menus: AdminMenusService,
    private readonly sections: AdminMenuSectionsService,
  ) {}

  @Get('menus/:menu_id')
  @Roles('admin')
  get(@Param('menu_id') id: string) {
    this.validateUuid(id, 'menu_id');
    return this.menus.getMenu(id);
  }

  @Patch('menus/:menu_id')
  @Roles('admin')
  update(@Param('menu_id') id: string, @Body() body: UpdateMenuDto) {
    this.validateUuid(id, 'menu_id');
    return this.menus.updateMenu(id, body);
  }

  @Post('menus/:menu_id/publish')
  @Roles('admin')
  publish(@Param('menu_id') id: string) {
    this.validateUuid(id, 'menu_id');
    return this.menus.publishMenu(id);
  }

  @Post('menus/:menu_id/unpublish')
  @Roles('admin')
  unpublish(@Param('menu_id') id: string) {
    this.validateUuid(id, 'menu_id');
    return this.menus.unpublishMenu(id);
  }

  // Reorder sections within a menu
  @Post('menus/:menu_id/sections/reorder')
  @Roles('admin')
  reorderSections(
    @Param('menu_id') id: string,
    @Body() body: { section_ids: string[] },
  ) {
    this.validateUuid(id, 'menu_id');
    const arr = body?.section_ids || [];
    // basic client-side validation of UUIDs to prevent 22P02
    arr.forEach((sid, i) => {
      if (!this.isUuid(sid)) throw new BadRequestException(`section_ids[${i}]_invalid`);
    });
    return this.sections.reorderSections(id, arr);
  }

  private validateUuid(value: string, field: string) {
    // basic UUID v4 pattern (accepting any hex version 1-5)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(value)) throw new BadRequestException(`${field}_invalid`);
  }

  private isUuid(value: string) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(value);
  }
}
