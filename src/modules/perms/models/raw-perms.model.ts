import { Field, ObjectType } from '@nestjs/graphql';
import { PermissionObject } from '../decorators/perms.decorator';

@ObjectType('RawPermission')
export class RawPermissionObject implements PermissionObject {
	@Field(() => String)
	name: Uppercase<string>;

	@Field()
	description: string;
}
