import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(2, 150, { message: 'Name must be between 2 and 150 characters' })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  // The long specification. Generous limit: this replaces the Word document
  // that used to be written before the work was split into cards.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @Length(0, 20000)
  brief?: string | null;

  @IsOptional()
  @IsHexColor({ message: 'Color must be a hex value like #rrggbb' })
  color?: string;

  @IsUUID('4', { message: 'workspaceId must be a UUID' })
  workspaceId!: string;
}
