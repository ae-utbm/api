import { Field, ObjectType } from '@nestjs/graphql';
import { Permission } from '../entities/permission.entity';
import { TPermission } from '../decorators/perms.decorator';

@ObjectType()
export class PermissionObject implements Omit<Permission, 'user'> {
	@Field()
	name: TPermission;

	@Field()
	value: number;

	@Field()
	revoked: boolean;

	@Field()
	expires: Date;

	@Field()
	id: number;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}
