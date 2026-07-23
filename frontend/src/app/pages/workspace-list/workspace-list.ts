import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { WorkspaceService } from '../../core/workspace.service';
import { Workspace } from '../../core/models';
import { readHttpError } from '../../core/http-error';

@Component({
  selector: 'app-workspace-list',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './workspace-list.html',
  styleUrl: './workspace-list.scss',
})
export class WorkspaceListComponent implements OnInit {
  private readonly api = inject(WorkspaceService);
  private readonly fb = inject(FormBuilder);

  // A signal is a reactive box: call .set() and the template redraws itself.
  readonly workspaces = signal<Workspace[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list().subscribe({
      next: (list) => {
        this.workspaces.set(list);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(readHttpError(err));
        this.loading.set(false);
      },
    });
  }

  toggleForm(): void {
    this.formOpen.update((open) => !open);
    if (!this.formOpen()) {
      this.form.reset();
    }
  }

  /** Fills the slug from the name until the user edits the slug themselves. */
  onNameInput(): void {
    const slugControl = this.form.controls.slug;
    if (slugControl.dirty) {
      return;
    }
    slugControl.setValue(this.toSlug(this.form.controls.name.value));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const { name, slug, description } = this.form.getRawValue();

    this.api
      .create({ name, slug, description: description || undefined })
      .subscribe({
        next: (created) => {
          // The create response has no _count, so we add an empty one.
          this.workspaces.update((list) => [
            ...list,
            { ...created, _count: { projects: 0 } },
          ]);
          this.form.reset();
          this.formOpen.set(false);
          this.saving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(readHttpError(err));
          this.saving.set(false);
        },
      });
  }

  remove(workspace: Workspace): void {
    const ok = confirm(
      `Delete "${workspace.name}"? All its projects and boards go with it.`,
    );
    if (!ok) {
      return;
    }

    this.api.remove(workspace.id).subscribe({
      next: () =>
        this.workspaces.update((list) =>
          list.filter((w) => w.id !== workspace.id),
        ),
      error: (err: HttpErrorResponse) => this.error.set(readHttpError(err)),
    });
  }

  /** Latin transliteration so Cyrillic names still produce a usable slug. */
  private toSlug(value: string): string {
    const map: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
      ю: 'yu', я: 'ya',
    };

    return value
      .toLowerCase()
      .split('')
      .map((char) => map[char] ?? char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
