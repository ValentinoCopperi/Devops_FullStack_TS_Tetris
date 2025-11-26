import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface Permission {
  resource: string;
  action: string;
}

/**
 * Decorator to specify required permissions for a route
 * Usage: @Permissions({ resource: 'user', action: 'delete' })
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

