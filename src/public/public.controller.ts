import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { PublicService } from './public.service';
import { MenuQueryDto } from './dto/menu-query.dto';
import { MenuSearchQueryDto } from './dto/search-query.dto';
import type { Request, Response } from 'express';
import { createHash } from 'crypto';

@Controller({
  path: 'public',
  version: '1',
})
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('restaurants')
  getRestaurants() {
    return this.service.listRestaurants();
  }

  @Get('restaurants/:slug')
  getRestaurant(@Param('slug') slug: string) {
    return this.service.getRestaurantBySlug(slug);
  }

  @Get('menus/:restaurant_slug')
  getMenu(
    @Param('restaurant_slug') restaurant_slug: string,
    @Query() query: MenuQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = this.service.getMenuForFront(restaurant_slug, query);

    // compute ETag from result and query (so different queries produce different etags)
    const hash = createHash('sha1')
      .update(JSON.stringify({ result, query }))
      .digest('hex');
    const etag = `"${hash}"`;

    // set ETag header
    res.setHeader('ETag', etag);
    // optional: client-side caching policy
    res.setHeader('Cache-Control', 'public, max-age=60');

    const inm = req.headers['if-none-match'];
    if (inm && String(inm) === etag) {
      // Not modified
      res.status(304).end();
      return;
    }

    return result;
  }

  @Get('menus/:restaurant_slug/search')
  searchMenuItems(
    @Param('restaurant_slug') restaurant_slug: string,
    @Query() query: MenuSearchQueryDto,
  ) {
    return this.service.searchMenuItems(restaurant_slug, query);
  }

  @Get('allergens')
  getAllergens() {
    return this.service.listAllergens();
  }

  @Get('tags')
  getTags(@Query('restaurant_slug') restaurant_slug?: string) {
    return this.service.listTags(restaurant_slug);
  }
}
