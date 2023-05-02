import { SetMetadata } from '@nestjs/common';

/**
 * Specify which args refer to the user id, used to determine if the
 * request is made by the user itself or not
 * @param {string} param - the field name
 */
export const Self = (param: string) => SetMetadata('id_param', param);
