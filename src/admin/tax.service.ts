import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RestaurantEntity } from 'src/entities/restaurant.entity';
import { TaxRateEntity } from 'src/entities/tax-rate.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaxService {
    constructor(
        @InjectRepository(TaxRateEntity) private readonly taxRatesRepo: Repository<TaxRateEntity>,
        @InjectRepository(RestaurantEntity) private readonly restaurantsRepo: Repository<RestaurantEntity>,
    ){}
    // Method to get tax rates for a specific restaurant
    async getTaxRatesForRestaurant(restaurantId: string) {
        const taxes = await this.taxRatesRepo.find({ where: { restaurant_id: restaurantId } });
        return taxes;
    }

    async createTaxRate(restaurantId: string, body: Partial<TaxRateEntity>) {
        // Implementation to create a new tax rate for the specified restaurant
        const restaurant = await this.restaurantsRepo.findOne({
        where: { id: restaurantId },
        });
        if (!restaurant) throw new NotFoundException('restaurant_not_found');
        
        const tax_rate : Partial<TaxRateEntity> = {
            restaurant_id: restaurantId,
            name: body.name? body.name : "Rate_"+Math.floor(Math.random()*1000), 
            rate_percent: body.rate_percent ? body.rate_percent : "0.00",
            included_in_price: body.included_in_price ? body.included_in_price : true,
            valid_from: body.valid_from ? body.valid_from : null,
            valid_to: body.valid_to ? body.valid_to : null,
        }
        this.restaurantsRepo.create(tax_rate);    
        return this.taxRatesRepo.save(tax_rate);

    }

    async updateTaxRate(taxRateId: string, body: Partial<TaxRateEntity>) {
        // Implementation to update the specified tax rate
        const existingTaxRate = await this.taxRatesRepo.findOne({ where: { id: taxRateId } });
        if (!existingTaxRate) {
            throw new NotFoundException('tax_rate_not_found');
        }
        const updatedTaxRate = {
            restaurant_id: body.restaurant_id ? body.restaurant_id : existingTaxRate.restaurant_id,
            name: body.name? body.name : existingTaxRate.name, 
            rate_percent: body.rate_percent ? body.rate_percent : existingTaxRate.rate_percent,
            included_in_price: body.included_in_price ? body.included_in_price : existingTaxRate.included_in_price,
            valid_from: body.valid_from ? body.valid_from : existingTaxRate.valid_from,
            valid_to: body.valid_to ? body.valid_to : existingTaxRate.valid_to,            
        };
        await this.taxRatesRepo.update(taxRateId, updatedTaxRate);
        return { ok: true };
    }     
    
    async deleteTaxRate(taxRateId: string) {
        // Implementation to delete the specified tax rate
        const existingTaxRate = await this.taxRatesRepo.findOne({ where: { id: taxRateId } });
        if (!existingTaxRate) {
            throw new NotFoundException('tax_rate_not_found');
        }
        await this.taxRatesRepo.delete(taxRateId);
        return { ok: true };
    }
}
