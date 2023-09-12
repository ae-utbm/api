import type { PermissionEntity, PERMISSION_NAMES } from '#types/api';

import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

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
