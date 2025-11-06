import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersAdminService {
  private readonly logger = new Logger(UsersAdminService.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async seedAdmins() {
    const admins = [
      { email: 'owner@test.com', password_hash: 'owner123', role: 'admin' },
      { email: 'manager@test.com', password_hash: 'manager123', role: 'admin' },
    ] as const;

    const created: string[] = [];
    for (const a of admins) {
      const exists = await this.usersRepo.findOne({ where: { email: a.email } });
      if (exists) continue;
      const username = a.email.split('@')[0];
      const entity = this.usersRepo.create({
        username,
        email: a.email,
        password_hash: a.password_hash, // NOTE: plain text for testing only
        role: a.role,
      });
      this.logger.debug(`Seeding admin user entity: ${JSON.stringify({ username: entity.username, email: entity.email, role: entity.role })}`);
      await this.usersRepo.save(entity);
      created.push(a.email);
    }
    return { inserted: created.length, emails: created };
  }
}
