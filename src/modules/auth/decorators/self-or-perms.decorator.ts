import type { PermissionName } from '@types';
import { applyDecorators } from '@nestjs/common';
import { GuardSelfParam } from './self.decorator';
import { GuardPermissions } from './permissions.decorator';

export const GuardSelfOrPermissions = (param: string, permissions: Array<PermissionName>) => {
	return applyDecorators(GuardSelfParam(param), GuardPermissions(...permissions));
};
