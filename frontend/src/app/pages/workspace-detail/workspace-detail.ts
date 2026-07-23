import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { WorkspaceService } from '../../core/workspace.service';
import { ProjectService } from '../../core/project.service';
import { Project, Workspace } from '../../core/models';

@Component({
  selector: 'app-workspace-detail',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './workspace-detail.html',
  styleUrl: './workspace-detail.scss',
})
export class WorkspaceDetailComponent implements OnInit {
  // Значение приходит из маршрута /workspaces/:id благодаря
  // withComponentInputBinding() в app.config.ts
  @Input() id!: string;

  private readonly workspacesApi = inject(WorkspaceService);
  private readonly projectsApi = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  readonly workspace = signal<Workspace | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);

  readonly palette = [
    '#4f46e5',
    '#059669',
    '#dc2626',
    '#d97706',
    '#0891b2',
    '#7c3aed',
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
        this.error.set(this.readError(err));
        this.loading.set(false);
      },
    });
  }

  toggleForm(): void {
    this.formOpen.update((open) => !open);
    if (!this.formOpen()) {
      this.form.reset({ color: this.palette[0] });
    }
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

    this.projectsApi
      .create({
        name,
        description: description || undefined,
        color,
        workspaceId: this.id,
      })
      .subscribe({
        next: (created) => {
          this.projects.update((list) => [
            ...list,
            { ...created, _count: { boards: 0 } },
          ]);
          this.form.reset({ color: this.palette[0] });
          this.formOpen.set(false);
          this.saving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(this.readError(err));
          this.saving.set(false);
        },
      });
  }

  remove(project: Project): void {
    if (!confirm(`Удалить проект «${project.name}» со всеми досками?`)) {
      return;
    }

    this.projectsApi.remove(project.id).subscribe({
      next: () =>
        this.projects.update((list) =>
          list.filter((p) => p.id !== project.id),
        ),
      error: (err: HttpErrorResponse) => this.error.set(this.readError(err)),
    });
  }

  private readError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Нет связи с сервером. Запущен ли backend на порту 3000?';
    }
    if (err.status === 404) {
      return 'Рабочее пространство не найдено';
    }
    const message: unknown = err.error?.message;
    if (Array.isArray(message)) {
      return message.join('. ');
    }
    if (typeof message === 'string') {
      return message;
    }
    return 'Что-то пошло не так';
  }
}
