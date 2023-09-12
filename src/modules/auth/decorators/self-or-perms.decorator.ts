import type { PERMISSION_NAMES } from '#types/api';

import { applyDecorators } from '@nestjs/common';

import { GuardPermissions } from './permissions.decorator';
import { GuardSelfParam } from './self.decorator';

export const GuardSelfOrPermissions = <T extends [PERMISSION_NAMES, ...PERMISSION_NAMES[]]>(
	param: string,
	permissions: T,
) => {
	return applyDecorators(GuardSelfParam(param), GuardPermissions(...permissions));
};
