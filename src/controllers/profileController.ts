import type { Request, Response } from 'express';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { getUser } from '../middlewares/auth.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import type { AuthUserDto } from '../dtos/authDto.ts';

export class ProfileController {
  constructor(private readonly userRepository: UserRepository = new UserRepository()) {}

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const { id } = getUser(req);
    const row = await this.userRepository.findById(id);
    if (!row) throw new NotFoundError('User tidak ditemukan');

    const data: AuthUserDto = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.status(200).json({ status: 'success', data });
  };
}