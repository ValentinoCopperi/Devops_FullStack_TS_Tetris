export interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  tokenFamily?: string; // for refresh tokens
  iat?: number;
  exp?: number;
}

export interface UserPayload {
  id: string;
  email: string;
  roles: string[];
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
}

