import { PlanCode } from '@prisma/client';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsEnum(PlanCode)
  planCode!: PlanCode;

  @IsString()
  @MaxLength(40)
  provider!: string;
}
