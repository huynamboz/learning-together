import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { UpdatePasswordDto, UpdateProfileDto } from './account.dto';
import { AccountService } from './account.service';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly service: AccountService) {}
  @Get() me(@Req() request: AuthenticatedRequest) { return this.service.me(request.user!.id); }
  @Patch() updateProfile(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) { return this.service.updateProfile(request.user!.id, dto); }
  @Patch('password') updatePassword(@Req() request: AuthenticatedRequest, @Body() dto: UpdatePasswordDto) { return this.service.updatePassword(request.user!.id, dto); }
  @Get('devices') devices(@Req() request: AuthenticatedRequest) { return this.service.devices(request.user!.id); }
  @Delete('devices/:id') removeDevice(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.service.removeDevice(request.user!.id, id); }
}
