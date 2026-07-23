import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  text?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
