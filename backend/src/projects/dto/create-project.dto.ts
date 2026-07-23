import { IsHexColor, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(2, 80, { message: 'Название: от 2 до 80 символов' })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsHexColor({ message: 'Цвет должен быть в формате #rrggbb' })
  color?: string;

  @IsUUID('4', { message: 'workspaceId должен быть UUID' })
  workspaceId!: string;
}
