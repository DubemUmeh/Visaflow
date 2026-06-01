import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@visaflow/shared-types';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to users with the specified roles.
 * Usage: @Roles('ADMIN', 'SUPER_ADMIN')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
