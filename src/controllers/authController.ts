import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';

export class AuthController {
  constructor(private readonly service: AuthService = new AuthService()) {}

  register = async (_req: Request, res: Response): Promise<void> => {
    const user = await this.service.register(getValidated<RegisterInput>(res, 'body'));
    res.status(201).json({ status: 'success', data: { user } });
  };

  login = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.login(getValidated<LoginInput>(res, 'body'));
    res.status(200).json({ status: 'success', data });
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: getUser(req) });
  };
}