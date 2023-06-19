import type { PermissionName, RoleEntity } from 'src/types';

import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { User } from '@modules/users/entities/user.entity';
import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PERMISSIONS_NAMES } from 'src/types/api/permissions/perms';

/**
 * Entity used to store roles, which are a collection of permissions
 */
@Entity({ tableName: 'roles' })
export class Role extends BaseEntity implements RoleEntity<Permission, User> {
	/** Name of the role, in caps */
	@Property()
	@ApiProperty()
	name: Uppercase<string>;

	/** Determine wether the role is still active */
	@Property({ name: 'is_revoked', onCreate: () => false })
	@ApiProperty()
	revoked = false;

	/** Specify when the role should expires */
	@Property({ name: 'expires_at' })
	@ApiProperty()
	expires: Date;

	/** Specify what permissions the role has */
	@Property({ name: 'permissions' })
	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	permissions: PermissionName[];

	/** Specify to which user the role is attached */
	@ManyToMany({ entity: () => User, inversedBy: 'roles' })
	@ApiProperty({ type: [Number] })
	users = new Collection<User>(this);
}
