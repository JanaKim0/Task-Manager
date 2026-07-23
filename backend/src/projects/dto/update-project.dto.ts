import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

// Проект нельзя переносить между пространствами, поэтому workspaceId исключён.
export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, ['workspaceId'] as const),
) {}
