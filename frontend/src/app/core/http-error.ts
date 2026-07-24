import { HttpErrorResponse } from '@angular/common/http';
import { DICTIONARIES, Language } from './i18n';

/**
 * Turns a failed request into a sentence a human can read.
 *
 * Messages the API itself sends (validation errors) are passed through as
 * they are; the connection-level ones are translated, since they never
 * reach the server to be worded there.
 */
export function readHttpError(
  err: HttpErrorResponse,
  language: Language = 'en',
): string {
  const t = DICTIONARIES[language].errors;

  if (err.status === 0) {
    return t.offline;
  }
  if (err.status === 404) {
    return t.notFound;
  }

  const message: unknown = err.error?.message;
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return t.generic;
}
