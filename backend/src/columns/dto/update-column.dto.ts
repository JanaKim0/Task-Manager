import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
