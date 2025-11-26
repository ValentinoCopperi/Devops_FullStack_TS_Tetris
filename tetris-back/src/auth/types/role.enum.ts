/**
 * Role enum - matches Prisma schema
 * This is a fallback type until Prisma generates the client
 */
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Auth Provider enum - matches Prisma schema
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

