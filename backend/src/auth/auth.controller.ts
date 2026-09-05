import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password, dto.deviceId);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) { return this.authService.refresh(dto.refreshToken); }

  @Post('logout')
  logout(@Body() dto: RefreshDto) { return this.authService.revoke(dto.refreshToken).then(() => ({ ok: true })); }
}
