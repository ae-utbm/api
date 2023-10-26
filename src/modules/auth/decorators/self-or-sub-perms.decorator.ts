import type { PERMISSION_NAMES } from '#types/api';

import { applyDecorators } from '@nestjs/common';

import { GuardPermissions } from './permissions.decorator';
import { GuardSelfOrSubscribed } from './self-or-subscribed.decorator';

/**
 * Set up the name of the parameter that contains the user id concerned by the route
 * and the permissions that the user must have to access the route
 * @param {string} param The name of the parameter that contains the user id
 * @param {PERMISSION_NAMES[]} permissions The permissions that the user must have to access the route
 */
export const GuardSelfOrPermsOrSub = (param: string, permissions: PERMISSION_NAMES[]) =>
	applyDecorators(GuardSelfOrSubscribed(param), GuardPermissions(...permissions));
