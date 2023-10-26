import type { PERMISSION_NAMES } from '#types/api';

import { SetMetadata } from '@nestjs/common';

/**
 * Set up what permissions are required to access the decorated route
 * @param {...PERMISSION_NAMES} permissions - list of permissions required to access the route
 */
export const GuardPermissions = (...permissions: PERMISSION_NAMES[]) => SetMetadata('guard_permissions', permissions);
