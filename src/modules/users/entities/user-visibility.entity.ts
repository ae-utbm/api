import type { UserVisibilityEntity } from '#types/api';

import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'users_visibility' })
export class UserVisibility extends BaseEntity implements UserVisibilityEntity<User> {
	/** Specify to which user those parameters belongs */
	@OneToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	@ApiProperty({ type: Number, minimum: 1 })
	user: User;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	email: boolean;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	secondary_email: boolean;

	/** Wether the user birth_date should be visible or not */
	@Property({ onCreate: () => true })
	@ApiProperty({ type: Boolean, default: true })
	birth_date: boolean;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	gender: boolean;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	pronouns: boolean;

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
	@ApiProperty({ type: Boolean, default: true })
	promotion: boolean;

	/** Wether the user phone should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	phone: boolean;

	/** Wether the user parent's contact should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	parent_contact: boolean;
}
