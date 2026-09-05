import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { CreateOrderDto } from './billing.dto';
import { BillingService } from './billing.service';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly service: BillingService) {}
  @Post('orders') createOrder(@Req() request: AuthenticatedRequest, @Body() dto: CreateOrderDto) { return this.service.createOrder(request.user!.id, dto); }
  @Get('orders') orders(@Req() request: AuthenticatedRequest) { return this.service.orders(request.user!.id); }
}
