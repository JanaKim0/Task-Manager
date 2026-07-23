import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Length(2, 60, { message: 'Name must be between 2 and 60 characters' })
  name!: string;

  @IsString()
  @Length(2, 40)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug may only contain lowercase letters, digits and hyphens',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
