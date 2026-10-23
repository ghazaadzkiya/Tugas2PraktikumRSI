import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import { verifyToken } from '../services/tokenService.ts';

const BEARER_PREFIX = 'Bearer ';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const token = (header.startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length)
    : header).trim();
  return token && !/\s/.test(token) ? token : null;
}

export const authenticate: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);
  if (!token) return next(new UnauthorizedError('Header Authorization dengan token Bearer wajib dikirim'));

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(new UnauthorizedError());
  }
};

export function getUser(req: Request) {
  if (!req.user) throw new UnauthorizedError('Endpoint ini harus memakai middleware authenticate');
  return req.user;
}