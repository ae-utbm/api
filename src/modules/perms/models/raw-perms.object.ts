import type { PermissionObject } from '@types';

import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Object used to return permission data to the client as how they are declared in the code
 */
@ObjectType()
export class RawPermissionObject implements PermissionObject {
	@Field(() => String)
	name: Uppercase<string>;

	@Field()
	description: string;
}
