import { Body, Controller, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreateQuoteDto } from './dto/quote-request.dto';

@Controller({ path: 'pricing', version: '1' })
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Post('quote')
  quote(@Body() body: CreateQuoteDto) {
    return this.pricing.computeQuote(body);
  }
}
