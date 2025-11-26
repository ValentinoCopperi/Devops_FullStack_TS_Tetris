import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the user from the request
 * Usage: @User() user: UserPayload
 * Usage: @User('id') userId: string
 */
export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

