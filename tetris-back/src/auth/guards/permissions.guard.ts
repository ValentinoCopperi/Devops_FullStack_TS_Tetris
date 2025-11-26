import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  Permission,
} from '../decorators/permissions.decorator';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId: user.id },
    });

    return requiredPermissions.some((required) =>
      userPermissions.some(
        (userPerm: any) =>
          userPerm.resource === required.resource &&
          userPerm.action === required.action,
      ),
    );
  }
}

