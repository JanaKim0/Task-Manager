import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderColumnsDto {
  @IsUUID('4', { message: 'boardId must be a UUID' })
  boardId!: string;

  /** Every column of the board, in the order it should appear. */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true, message: 'orderedIds must contain UUIDs' })
  orderedIds!: string[];
}
