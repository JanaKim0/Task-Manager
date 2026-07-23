import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns a failed request into a sentence a human can read.
 * Nest puts the reason in `message`, which is a string or an array of strings.
 */
export function readHttpError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'Cannot reach the server. Is the backend running on port 3333?';
  }
  if (err.status === 404) {
    return 'Not found. It may have been deleted.';
  }

  const message: unknown = err.error?.message;
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return 'Something went wrong.';
}
