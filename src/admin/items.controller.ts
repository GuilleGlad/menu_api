import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { MenuItemsService } from './items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { Roles } from 'src/auth/roles.decorator';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class ItemsController {
    constructor(
        private readonly itemsService: MenuItemsService,
    ){}

    @Get("items/:item_id")
    @Roles('admin')
    getItems(@Param('item_id') id: string) {
        const item = this.itemsService.getItemById(id);
        return item;
    }
    
    @Patch("items/:item_id")
    @Roles('admin')
    updateItem(@Param('item_id') id: string, @Body() body: CreateMenuItemDto){
    return this.itemsService.updateItem(id, body);
    }

    @Delete("items/:item_id")
    @Roles('admin')
    deleteItem(@Param('item_id') id: string){
        return this.itemsService.deleteItem(id);
    }   
}
