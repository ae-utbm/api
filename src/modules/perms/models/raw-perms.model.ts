import { Field, ObjectType } from '@nestjs/graphql';
import { PermissionObject } from '@/modules/auth/decorators/perms.decorator';

@ObjectType('RawPermissionObject')
export class RawPermissionObject implements PermissionObject {
	@Field(() => String)
	name: Uppercase<string>;

	@Field()
	description: string;
}
