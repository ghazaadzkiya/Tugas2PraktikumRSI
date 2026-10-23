import { AppError } from './AppError.ts';

export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}