import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityRuleEntity } from '../entities/availability-rule.entity';
import { CreateAvailabilityRuleDto } from './dto/create-availability-rule.dto';
import { UpdateAvailabilityRuleDto } from './dto/update-availability-rule.dto';
import { RestaurantEntity } from '../entities/restaurant.entity';

@Injectable()
export class AvailabilityAdminService {
  constructor(
    @InjectRepository(AvailabilityRuleEntity) private readonly rulesRepo: Repository<AvailabilityRuleEntity>,
    @InjectRepository(RestaurantEntity) private readonly restaurantsRepo: Repository<RestaurantEntity>,
  ) {}

  async listForRestaurant(restaurantId: string) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('restaurant_not_found');
    return this.rulesRepo.find({ where: { restaurant_id: restaurantId }, order: { id: 'ASC', start_time: 'ASC' } });
  }

  async createRule(body: CreateAvailabilityRuleDto) {
    const restaurant = await this.restaurantsRepo.findOne({ where: { id: body.restaurant_id } });
    if (!restaurant) throw new NotFoundException('restaurant_not_found');

    const rule = this.rulesRepo.create({
      restaurant_id: body.restaurant_id,
      target_type: body.target_type ?? null,
      target_id: body.target_id ?? null,
      day_of_week: body.day_of_week ?? null,
      start_time: body.start_time ?? "00:00:00",
      end_time: body.end_time ?? "12:00:00",
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
    } as Partial<AvailabilityRuleEntity>);
    return this.rulesRepo.save(rule);
  }

  async updateRule(ruleId: string, patch: UpdateAvailabilityRuleDto) {
    const rule = await this.rulesRepo.findOne({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('rule_not_found');

    Object.assign(rule, patch);
    return this.rulesRepo.save(rule);
  }

  async deleteRule(ruleId: string) {
    const rule = await this.rulesRepo.findOne({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('rule_not_found');
    await this.rulesRepo.delete(ruleId);
    return { ok: true };
  }
}
