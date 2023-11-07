import type { PERMISSION_NAMES } from '#types/api';

import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { BaseEntity } from '@modules/base/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'permissions' })
export class Permission extends BaseEntity {
	@Property()
	name: PERMISSION_NAMES;

	@Property({ name: 'is_revoked', default: false })
	revoked: boolean;

	@Property({ name: 'expires_at' })
	expires: Date;

	@ManyToOne(() => User, {
		onDelete: 'cascade',
		joinColumn: 'user_id',
		serializedName: 'user_id',
		serializer: (u: User) => u.id,
	})
	user: User;
}
