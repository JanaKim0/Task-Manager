import { IsString, IsUUID, Length } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @Length(1, 40, { message: 'Name must be between 1 and 40 characters' })
  name!: string;

  @IsUUID('4', { message: 'boardId must be a UUID' })
  boardId!: string;
}
