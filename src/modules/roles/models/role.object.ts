import type { PermissionName } from '@types';

import { Field, ObjectType } from '@nestjs/graphql';
import { BaseObject } from '@database/models/base.object';

/**
 * Object used to return permission data to the client as how they are attached to users
 */
@ObjectType()
export class RoleObject extends BaseObject {
	@Field(() => String)
	name: Uppercase<string>;

	@Field()
	revoked: boolean;

	@Field()
	expires: Date;

	@Field(() => [String])
	permissions: PermissionName[];
}
