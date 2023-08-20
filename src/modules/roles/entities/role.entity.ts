import type { PERMISSION_NAMES, RoleEntity } from '@types';

import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { User } from '@modules/users/entities/user.entity';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

/**
 * Entity used to store roles, which are a collection of permissions
 */
@Entity({ tableName: 'roles' })
export class Role extends BaseEntity implements RoleEntity<Permission, User> {
	/** Name of the role, in caps */
	@Property({ unique: true })
	@ApiProperty({ type: String, example: 'AE_ADMIN' })
	name: Uppercase<string>;

	/** Determine wether the role is still active */
	@Property({ name: 'is_revoked', onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	revoked: boolean;

	/** Specify when the role should expires */
	@Property({ name: 'expires_at' })
	@ApiProperty()
	expires: Date;

	/** Specify what permissions the role has */
	@Property({ name: 'permissions' })
	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	permissions: PERMISSION_NAMES[];

	/** Specify to which user the role is attached */
	@ManyToMany(() => User, (user) => user.roles, { owner: true })
	@ApiProperty({ type: Number, default: 1 })
	users = new Collection<User>(this);
}
