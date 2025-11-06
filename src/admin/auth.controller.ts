import { Body, Controller, Post } from '@nestjs/common';
import { AdminLoginDto } from './dto/login.dto';
import { AdminAuthService } from './auth.service';

@Controller({ path: 'admin/auth', version: '1' })
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post('login')
  login(@Body() body: AdminLoginDto) {
    return this.service.validateAndLogin(body.email, body.password);
  }
}
