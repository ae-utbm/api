import type { PermissionName } from '@types';
import { applyDecorators } from '@nestjs/common';
import { GuardSelfParam } from './self.decorator';
import { GuardPermissions } from './permissions.decorator';

export const GuardSelfOrPermissions = <T extends [PermissionName, ...PermissionName[]]>(
	param: string,
	permissions: T,
) => {
	return applyDecorators(GuardSelfParam(param), GuardPermissions(...permissions));
};
