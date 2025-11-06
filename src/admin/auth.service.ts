import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async validateAndLogin(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('invalid_credentials');
    // NOTE: passwords are stored in plain for testing; replace with bcrypt compare in prod
    if (user.password_hash !== password) throw new UnauthorizedException('invalid_credentials');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const token = await this.jwt.signAsync(payload);
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 2 * 60 * 60, // seconds (matches expiresIn below)
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
