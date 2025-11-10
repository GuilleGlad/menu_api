import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    try {
      const email = 'owner@test.com';
      const existing = await this.usersRepo.findOne({ where: { email } });
      if (existing) return;
      const username = email.split('@')[0];
      const user = this.usersRepo.create({
        username,
        email,
        password_hash: 'owner123', // NOTE: dev only; plain text for quick testing
        role: 'admin', // collapsed role model
      });
      await this.usersRepo.save(user);
      this.logger.log(`Seeded default admin user: ${email}`);
    } catch (e) {
      this.logger.warn(`Admin bootstrap skipped or failed: ${e?.message ?? e}`);
    }
  }
}
