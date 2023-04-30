import { SetMetadata } from '@nestjs/common';

export const Self = (param: string) => SetMetadata('id_param', param);
