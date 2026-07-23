import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateCardDto {
  @IsString()
  @Length(1, 200, { message: 'Title must be between 1 and 200 characters' })
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  // The deadline is optional. `null` explicitly clears it, which is why
  // ValidateIf skips the date check when the value is null.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString({}, { message: 'dueDate must be an ISO date string' })
  dueDate?: string | null;

  @IsOptional()
  @IsEnum(Priority, { message: 'priority must be LOW, MEDIUM, HIGH or URGENT' })
  priority?: Priority;

  @IsUUID('4', { message: 'columnId must be a UUID' })
  columnId!: string;
}
