import type { PERMISSION_NAMES } from '#types/api';

import { applyDecorators } from '@nestjs/common';

import { GuardPermissions } from './permissions.decorator';
import { GuardSelfParam } from './self.decorator';

/**
 * Set up the name of the parameter that contains the user id concerned by the route
 * and the permissions that the user must have to access the route
 * @param {string} param The name of the parameter that contains the user id
 * @param {PERMISSION_NAMES[]} permissions The permissions that the user must have to access the route
 */
export const GuardSelfOrPermissions = (param: string, permissions: PERMISSION_NAMES[]) => {
	return applyDecorators(GuardSelfParam(param), GuardPermissions(...permissions));
};
