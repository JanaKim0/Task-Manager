import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

/**
 * Replaces the browser's confirm() with a dialog that matches the app.
 *
 * A component calls `ask()` and awaits the answer; the dialog component
 * renders whatever sits in `request` and calls `answer()` on click.
 *
 * The labels are passed in rather than translated here, so the caller
 * decides the wording in the language it is already using.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);

  private resolve: ((confirmed: boolean) => void) | null = null;

  ask(options: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
  }): Promise<boolean> {
    // If a dialog is somehow already open, treat it as cancelled.
    this.resolve?.(false);

    this.request.set({
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
      danger: options.danger ?? true,
    });

    return new Promise<boolean>((resolve) => {
      this.resolve = resolve;
    });
  }

  answer(confirmed: boolean): void {
    this.request.set(null);
    this.resolve?.(confirmed);
    this.resolve = null;
  }
}
