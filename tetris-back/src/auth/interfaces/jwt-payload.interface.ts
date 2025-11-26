export interface JwtPayload {
  sub: string; 
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  tokenFamily?: string; 
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

