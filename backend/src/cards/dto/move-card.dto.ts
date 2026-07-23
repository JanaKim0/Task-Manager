import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveCardDto {
  /** Target column. Omitted when the card only moves within its own column. */
  @IsOptional()
  @IsUUID('4', { message: 'columnId must be a UUID' })
  columnId?: string;

  /** Zero-based slot the card should end up in inside the target column. */
  @IsInt()
  @Min(0)
  position!: number;
}
