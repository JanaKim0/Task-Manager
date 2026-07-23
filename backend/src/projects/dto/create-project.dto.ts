import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(2, 80, { message: 'Name must be between 2 and 80 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsHexColor({ message: 'Color must be a hex value like #rrggbb' })
  color?: string;

  @IsUUID('4', { message: 'workspaceId must be a UUID' })
  workspaceId!: string;
}
