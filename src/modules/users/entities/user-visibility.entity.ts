import type { UserVisibilityEntity } from '@types';

import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';

import { User } from './user.entity';

@Entity({ tableName: 'users_visibility' })
export class UserVisibility extends BaseEntity implements UserVisibilityEntity<User> {
	/** Specify to which user those parameters belongs */
	@OneToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	@ApiProperty({ type: Number })
	user: User;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	email = false;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	secondary_email = false;

	/** Wether the user birthday should be visible or not */
	@Property({ onCreate: () => true })
	@ApiProperty({ type: Boolean })
	birthday = true;

	/** Wether the user nickname should be visible or not */
	@Property({ onCreate: () => true })
	@ApiProperty({ type: Boolean })
	nickname = true;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	gender = false;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	pronouns = false;

	/** Wether the user cursus should be visible or not */
	@Property({ onCreate: () => true })
	@ApiProperty({ type: Boolean })
	cursus = true;

	/** Wether the user cursus should be visible or not */
	@Property({ onCreate: () => true })
	@ApiProperty({ type: Boolean })
	specialty = true;

	/** Wether the user promotion should be visible or not */
	@Property({ onCreate: () => true })
	@ApiProperty({ type: Boolean })
	promotion = true;

	/** Wether the user phone should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	phone = false;

	/** Wether the user parent's contact should be visible or not */
	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	parent_contact = false;
}
