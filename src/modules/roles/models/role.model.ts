import { Field, ObjectType } from '@nestjs/graphql';
import { Role } from '../entities/role.entity';
import { PermissionName } from '@/modules/auth/decorators/perms.decorator';

@ObjectType('RoleObject')
export class RoleObject implements Omit<Role, 'users'> {
	@Field(() => String)
	readonly name: Uppercase<string>;

	@Field()
	readonly revoked: boolean;

	@Field()
	readonly expires: Date;

	@Field(() => [String])
	readonly permissions: PermissionName[];

	@Field()
	readonly id: number;

	@Field()
	readonly createdAt: Date;

	@Field()
	readonly updatedAt: Date;
}
