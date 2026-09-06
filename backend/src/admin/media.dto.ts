import { IsIn } from 'class-validator';

export class UpdateMediaVisibilityDto {
  @IsIn(['public', 'private'])
  visibility!: 'public' | 'private';
}
