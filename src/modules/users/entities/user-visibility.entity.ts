import { Entity, Property, OneToOne } from '@mikro-orm/core';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'users_visibility' })
export class UserVisibility extends BaseEntity {
	/** Specify to which user those parameters belongs */
	@OneToOne(() => User, {
		onDelete: 'cascade',
		joinColumn: 'user_id',
		serializedName: 'user_id',
		serializer: (u: User) => u.id,
	})
	user: User;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	email: boolean;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	secondary_email: boolean;

	/** Wether the user birth_date should be visible or not */
	@Property({ onCreate: () => true })
	birth_date: boolean;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	gender: boolean;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	pronouns: boolean;

	// TODO: (KEY: 1) Make a PR to implement cursus & specialty in the API
	/** Wether the user cursus should be visible or not */
	// @Property({ onCreate: () => true })
	// @ApiProperty({ type: Boolean, default: true })
	// cursus: boolean;

	/** Wether the user cursus should be visible or not */
	// @Property({ onCreate: () => true })
	// @ApiProperty({ type: Boolean, default: true })
	// specialty: boolean;

	/** Wether the user promotion should be visible or not */
	@Property({ onCreate: () => true })
	promotion: boolean;

	/** Wether the user phone should be visible or not */
	@Property({ onCreate: () => false })
	phone: boolean;

	/** Wether the user parent's contact should be visible or not */
	@Property({ onCreate: () => false })
	parent_contact: boolean;
}
