import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

// A project cannot be moved between workspaces, so workspaceId is excluded.
export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, ['workspaceId'] as const),
) {}
