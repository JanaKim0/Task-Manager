import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Length(2, 60, { message: 'Название: от 2 до 60 символов' })
  name!: string;

  @IsString()
  @Length(2, 40)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug: только строчные латинские буквы, цифры и дефис',
  })
  slug!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
