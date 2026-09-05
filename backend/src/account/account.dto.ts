import { IsString, IsUUID, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class DeviceIdDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
