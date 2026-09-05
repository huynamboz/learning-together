import { IsIn, IsUUID } from 'class-validator';

export class ReviewVocabularyDto {
  @IsUUID()
  entryId!: string;

  @IsIn(['again', 'hard', 'good', 'easy'])
  rating!: 'again' | 'hard' | 'good' | 'easy';
}
