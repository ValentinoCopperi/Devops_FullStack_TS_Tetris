import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * Usage: @Roles('ADMIN', 'MODERATOR')
 * 
 * Note: Use Role enum from generated Prisma client after running prisma generate
 * import { Role } from 'generated/prisma/client';
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

