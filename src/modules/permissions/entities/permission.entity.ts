import type { PermissionEntity, PERMISSION_NAMES } from '@types';

import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

@Entity({ tableName: 'permissions' })
export class Permission extends BaseEntity implements PermissionEntity<User> {
	@Property()
	@ApiProperty({ enum: PERMISSIONS_NAMES })
	name: PERMISSION_NAMES;

	@Property({ name: 'is_revoked', default: false })
	@ApiProperty({ type: Boolean })
	revoked: boolean;

	@Property({ name: 'expires_at' })
	@ApiProperty()
	expires: Date;

	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	@ApiProperty({ type: Number })
	user: User;
}
