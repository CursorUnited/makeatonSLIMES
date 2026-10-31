/**
 * Business-rule error. The error handler turns it into
 * `{ error: { code, message, fields? } }` with `status`.
 */
export class AppError extends Error {
  constructor(code, message, status = 400, fields) {
    super(message);
    this.name = 'AppError';
    Object.assign(this, { code, status, fields });
  }
}

export const notFound = (what = 'Record') => new AppError('NOT_FOUND', `${what} not found.`, 404);
export const forbidden = () => new AppError('FORBIDDEN', "You don't have access to this.", 403);
