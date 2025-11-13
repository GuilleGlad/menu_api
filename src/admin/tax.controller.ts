import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TaxService } from './tax.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TaxRateEntity } from 'src/entities/tax-rate.entity';
import { PublicService } from 'src/public/public.service';


@Controller({ path: 'admin', version: '1' })
@UseGuards(AdminAuthGuard, RolesGuard)
export class TaxController {
    constructor(
        private readonly taxService: TaxService,
        private readonly service: PublicService,
    ){

    }

    @Get('restaurants/:id/tax-rates')
    getTaxRates(@Param('id') restaurantId: string) {
        // Implementation to retrieve tax rates for the specified restaurant
        return this.taxService.getTaxRatesForRestaurant(restaurantId);
    }

    @Post('restaurants/:id/tax-rates')
    async createTaxRate(@Param('id') restaurantId: string, @Body() body: Partial<TaxRateEntity>) {
        return this.taxService.createTaxRate(restaurantId, body);
    }

    @Patch('tax-rates/:id')
    async updateTaxRate(@Param('id') taxRateId: string, @Body() body: Partial<TaxRateEntity>) {
        return this.taxService.updateTaxRate(taxRateId, body);
    }

    @Delete('tax-rates/:id')
    async deleteTaxRate(@Param('id') taxRateId: string) {
        return this.taxService.deleteTaxRate(taxRateId);
    }
}
