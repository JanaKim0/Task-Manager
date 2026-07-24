import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { WorkspaceService } from '../../core/workspace.service';
import { ProjectService } from '../../core/project.service';
import { Project, Workspace } from '../../core/models';
import { readHttpError } from '../../core/http-error';
import { ConfirmService } from '../../core/confirm.service';

@Component({
  selector: 'app-workspace-detail',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './workspace-detail.html',
  styleUrl: './workspace-detail.scss',
})
export class WorkspaceDetailComponent implements OnInit {
  // Comes from the /workspaces/:id route thanks to withComponentInputBinding()
  // in app.config.ts.
  @Input() id!: string;

  private readonly workspacesApi = inject(WorkspaceService);
  private readonly projectsApi = inject(ProjectService);
  private readonly fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmService);

  readonly workspace = signal<Workspace | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly palette = [
    '#e8749c',
    '#c98bc0',
    '#f0a868',
    '#7cc4a4',
    '#7fa8d4',
    '#b6a3e0',
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    color: [this.palette[0], Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.workspacesApi.get(this.id).subscribe({
      next: (ws) => {
        this.workspace.set(ws);
        this.projects.set(ws.projects ?? []);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(readHttpError(err));
        this.loading.set(false);
      },
    });
  }

  /** Opens the form empty for a new project. */
  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ color: this.palette[0] });
    this.formOpen.set(true);
  }

  /** Opens the same form pre-filled to edit an existing project. */
  openEdit(project: Project): void {
    this.editingId.set(project.id);
    this.form.setValue({
      name: project.name,
      description: project.description ?? '',
      color: project.color,
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.form.reset({ color: this.palette[0] });
  }

  pickColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const { name, description, color } = this.form.getRawValue();
    const editingId = this.editingId();

    const request = editingId
      ? this.projectsApi.update(editingId, {
          name,
          description: description || undefined,
          color,
        })
      : this.projectsApi.create({
          name,
          description: description || undefined,
          color,
          workspaceId: this.id,
        });

    request.subscribe({
      next: (saved) => {
        if (editingId) {
          this.projects.update((list) =>
            list.map((p) => (p.id === editingId ? { ...p, ...saved } : p)),
          );
        } else {
          this.projects.update((list) => [...list, saved]);
        }
        this.closeForm();
        this.saving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(readHttpError(err));
        this.saving.set(false);
      },
    });
  }

  async remove(project: Project): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete "${project.name}"?`,
      message: 'Its board, columns and cards will be deleted too.',
      confirmLabel: 'Delete project',
    });
    if (!ok) {
      return;
    }

    this.projectsApi.remove(project.id).subscribe({
      next: () =>
        this.projects.update((list) => list.filter((p) => p.id !== project.id)),
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  /** Every project is created with a default board; this returns its id. */
  firstBoardId(project: Project): string | null {
    return project.boards?.[0]?.id ?? null;
  }
}
