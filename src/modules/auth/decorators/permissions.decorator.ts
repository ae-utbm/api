import type { PERMISSION_NAMES } from '#types/api';

import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

/**
 * Set up what permissions are required to access the decorated route
 * @param {...PERMISSION_NAMES} permissions - list of permissions required to access the route
 */
export const GuardPermissions = (...permissions: PERMISSION_NAMES[]) =>
	applyDecorators(
		SetMetadata('guard_permissions', permissions),
		ApiForbiddenResponse({ description: 'Forbidden, missing permissions' }),
		ApiUnauthorizedResponse({ description: 'Unauthorized, missing authentification token' }),
	);
