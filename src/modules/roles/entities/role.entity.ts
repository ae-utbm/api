import type { PERMISSION_NAMES } from '#types/api';

import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

/**
 * Entity used to store roles, which are a collection of permissions
 */
@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
	@Property({ unique: true })
	name: Uppercase<string>;

	@Property({ name: 'is_revoked', onCreate: () => false })
	revoked: boolean;

	@Property({ name: 'permissions' })
	permissions: PERMISSION_NAMES[];

	@ManyToMany(() => User, (user) => user.roles, { owner: true })
	users = new Collection<User>(this);
}
