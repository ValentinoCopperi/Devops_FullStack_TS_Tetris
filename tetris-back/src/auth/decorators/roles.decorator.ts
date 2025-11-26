import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

//Decorador para marcar una ruta como segura por roles
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

