import { IsString, IsUUID, Length } from 'class-validator';

export class CreateChecklistItemDto {
  @IsString()
  @Length(1, 200, { message: 'A checklist item cannot be empty' })
  text!: string;

  @IsUUID('4', { message: 'cardId must be a UUID' })
  cardId!: string;
}
