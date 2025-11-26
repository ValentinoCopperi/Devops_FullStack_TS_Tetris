/**
 * Auth Module Usage Examples
 * 
 * This file demonstrates how to use the authentication system
 * in your controllers and services.
 */

import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { User } from '../decorators/user.decorator';
import { Public } from '../decorators/public.decorator';
import { UserPayload } from '../interfaces/jwt-payload.interface';
import { Role } from 'generated/prisma/client';

/**
 * Example 1: Protected Route (Requires Authentication)
 */
@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get('profile')
  getProfile(@User() user: UserPayload) {
    // User is automatically injected from JWT token
    return {
      message: 'This is your profile',
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
  }

  @Get('user-id')
  getUserId(@User('id') userId: string) {
    // Extract specific property from user
    return { userId };
  }
}

/**
 * Example 2: Role-Based Access Control (RBAC)
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(Role.ADMIN)
  getDashboard(@User() user: UserPayload) {
    return { message: 'Admin dashboard', user };
  }

  @Get('moderator')
  @Roles(Role.ADMIN, Role.MODERATOR)
  getModeratorPanel() {
    // Accessible by ADMIN or MODERATOR
    return { message: 'Moderator panel' };
  }

  @Post('super-admin')
  @Roles(Role.SUPER_ADMIN)
  performSuperAdminAction() {
    return { message: 'Super admin action executed' };
  }
}

/**
 * Example 3: Attribute-Based Access Control (ABAC)
 */
@Controller('resources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResourceController {
  @Get()
  @Permissions({ resource: 'user', action: 'read' })
  listResources() {
    return { message: 'List of resources' };
  }

  @Delete(':id')
  @Permissions({ resource: 'user', action: 'delete' })
  deleteResource(@Param('id') id: string, @User('id') userId: string) {
    // Only users with 'delete' permission on 'user' resource can access
    return { message: `Resource ${id} deleted by ${userId}` };
  }

  @Post()
  @Permissions({ resource: 'user', action: 'create' })
  createResource(@Body() data: any) {
    return { message: 'Resource created', data };
  }
}

/**
 * Example 4: Mixed Protection (Public + Protected Routes)
 */
@Controller('posts')
@UseGuards(JwtAuthGuard) // Global guard for this controller
export class PostsController {
  @Get()
  @Public() // Override global guard - no authentication required
  listPublicPosts() {
    return { message: 'Public posts' };
  }

  @Get('my-posts')
  // Authentication required (from controller-level guard)
  getMyPosts(@User('id') userId: string) {
    return { message: `Posts by user ${userId}` };
  }

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  createPost(@User() user: UserPayload, @Body() data: any) {
    return { message: 'Post created', author: user.email, data };
  }
}

/**
 * Example 5: Service with Auth Logic
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AuditService } from '../services/audit.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
      },
    });

    // Log the access
    await this.audit.log({
      userId,
      action: 'USER_DATA_ACCESSED',
      resource: 'user',
      success: true,
    });

    return user;
  }

  async updateUserRole(userId: string, newRole: Role, adminId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { roles: { push: newRole } },
    });

    // Audit the role change
    await this.audit.log({
      userId: adminId,
      action: 'ROLE_UPDATED',
      resource: 'user',
      details: `Updated user ${userId} role to ${newRole}`,
      success: true,
    });
  }
}

/**
 * Example 6: Dynamic Permission Check
 */
@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const permission = await this.prisma.userPermission.findFirst({
      where: {
        userId,
        resource,
        action,
      },
    });

    return !!permission;
  }

  async grantPermission(userId: string, resource: string, action: string) {
    return this.prisma.userPermission.create({
      data: {
        userId,
        resource,
        action,
      },
    });
  }

  async revokePermission(userId: string, resource: string, action: string) {
    return this.prisma.userPermission.deleteMany({
      where: {
        userId,
        resource,
        action,
      },
    });
  }
}

/**
 * Example 7: Custom Guard Combining Multiple Checks
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomAuthGuard implements CanActivate {
  constructor(private readonly permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Custom logic: Check if user is verified AND has specific permission
    if (!user.isEmailVerified) {
      return false;
    }

    // Check permission dynamically
    const hasPermission = await this.permissionService.hasPermission(
      user.id,
      'custom-resource',
      'access',
    );

    return hasPermission;
  }
}

/**
 * Example 8: Rate Limiting for Specific Endpoint
 */
import { Throttle } from '@nestjs/throttler';

@Controller('api')
export class ApiController {
  @Post('expensive-operation')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async expensiveOperation(@User('id') userId: string) {
    // This endpoint is rate-limited to 3 requests per minute
    return { message: 'Expensive operation completed', userId };
  }
}

/**
 * Example 9: Conditional Authorization
 */
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getPost(@Param('id') postId: string, @User() user: UserPayload) {
    const post = await this.prisma.user.findUnique({
      where: { id: postId },
    });

    // Allow if user is admin OR is the post author
    const isAdmin = user.roles.includes(Role.ADMIN);
    const isAuthor = post?.id === user.id;

    if (!isAdmin && !isAuthor) {
      throw new Error('Unauthorized');
    }

    return post;
  }
}

/**
 * Example 10: Logout from Service
 */
@Injectable()
export class SessionService {
  constructor(private readonly authService: any) {}

  async logoutUser(userId: string, refreshToken?: string) {
    await this.authService.logout(userId, refreshToken);
    
    // Additional cleanup if needed
    // Clear user cache, notify other services, etc.
  }

  async logoutAllDevices(userId: string) {
    await this.authService.revokeAllTokens(userId);
    
    // Notify user about logout from all devices
  }
}

