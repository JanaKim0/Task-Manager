import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/confirm.service';

/** Rendered once in the app shell; shows whatever ConfirmService asks for. */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  private readonly confirm = inject(ConfirmService);

  readonly request = this.confirm.request;

  answer(confirmed: boolean): void {
    this.confirm.answer(confirmed);
  }
}
