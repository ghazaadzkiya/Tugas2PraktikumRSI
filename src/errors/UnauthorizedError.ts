import { AppError } from './AppError.ts';

export class UnauthorizedError extends AppError {
  constructor(message = 'Token tidak valid atau belum dikirim') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}