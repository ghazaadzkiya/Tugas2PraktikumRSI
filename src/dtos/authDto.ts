import type { UserRole } from '../repositories/userRepository.ts';

export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponseDto {
  token: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUserDto;
}

export interface RegisterResponseDto {
  user: AuthUserDto;
}