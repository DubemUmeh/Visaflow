import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserEntity } from '@visaflow/shared-types';

/**
 * Extracts the authenticated user from the request object.
 * Usage: @CurrentUser() user: UserEntity
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserEntity;
    return data ? user?.[data] : user;
  },
);
