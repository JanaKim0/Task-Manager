import { IsString, IsUUID, Length } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @Length(1, 2000, { message: 'A note cannot be empty' })
  body!: string;

  @IsUUID('4', { message: 'cardId must be a UUID' })
  cardId!: string;
}

export class UpdateNoteDto {
  @IsString()
  @Length(1, 2000, { message: 'A note cannot be empty' })
  body!: string;
}
