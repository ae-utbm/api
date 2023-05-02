import { Field, ObjectType } from '@nestjs/graphql';
import { Permission } from '../entities/permission.entity';
import { PermissionName } from '@/modules/auth/decorators/perms.decorator';

@ObjectType('PermissionObject')
export class PermissionObject implements Omit<Permission, 'user'> {
	@Field()
	readonly name: PermissionName;

	@Field()
	readonly revoked: boolean;

	@Field()
	readonly expires: Date;

	@Field()
	readonly id: number;

	@Field()
	readonly createdAt: Date;

	@Field()
	readonly updatedAt: Date;
}
