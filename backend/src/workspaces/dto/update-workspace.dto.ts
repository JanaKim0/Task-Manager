import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkspaceDto } from './create-workspace.dto';

// PartialType makes every field of CreateWorkspaceDto optional, which is
// exactly what PATCH needs: only the changed fields are sent.
export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {}
