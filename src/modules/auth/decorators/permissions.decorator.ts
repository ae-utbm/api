import type { PERMISSION_NAMES } from '#types/api';

import { SetMetadata } from '@nestjs/common';

/**
 * Set up what permissions are required to access the decorated route
 * @param {...PERMISSION_NAMES} permissions - list of permissions required to access the route
 */
export const GuardPermissions = <T extends [PERMISSION_NAMES, ...PERMISSION_NAMES[]]>(...permissions: T) =>
	SetMetadata('guard_permissions', permissions);
