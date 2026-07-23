import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkspaceDto } from './create-workspace.dto';

// PartialType делает все поля CreateWorkspaceDto необязательными —
// удобно для PATCH, где меняют только часть полей.
export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {}
