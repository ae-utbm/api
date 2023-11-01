import type { IUserVisibilityPatchDTO, IUserPatchDTO } from '#types/api';

import { UserGetDTO, UserVisibilityGetDTO } from './get.dto';

export class UserPatchDTO extends UserGetDTO implements IUserPatchDTO {}
export class UserVisibilityPatchDTO extends UserVisibilityGetDTO implements IUserVisibilityPatchDTO {}
