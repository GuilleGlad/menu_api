import { Test, TestingModule } from '@nestjs/testing';
import { TaxServiceService } from './tax.service';

describe('TaxServiceService', () => {
  let service: TaxServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxServiceService],
    }).compile();

    service = module.get<TaxServiceService>(TaxServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
