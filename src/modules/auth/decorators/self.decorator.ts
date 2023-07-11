import { SetMetadata } from '@nestjs/common';

/**
 * Set up the name of the parameter that contains the user id concerned by the route
 * @param {string} param The name of the parameter that contains the user id
 */
export const GuardSelfParam = (param: string) => SetMetadata('guard_self_param_key', param);
