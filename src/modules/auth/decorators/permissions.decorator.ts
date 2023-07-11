import type { PermissionName } from '@types';

import { SetMetadata } from '@nestjs/common';

/**
 * Set up what permissions are required to access the decorated route
 * @param {...PermissionName} permissions - list of permissions required to access the route
 */
export const GuardPermissions = <T extends [PermissionName, ...PermissionName[]]>(...permissions: T) =>
	SetMetadata('guard_permissions', permissions);
