import { BaseEntity } from 'src/database/entities/base.entity';
import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ tableName: 'users_visibility' })
export class UserVisibility extends BaseEntity {
	/** Specify to which user those parameters belongs */
	@OneToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	user: User;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	email = false;

	/** Wether the user email should be visible or not */
	@Property({ onCreate: () => false })
	secondary_email = false;

	/** Wether the user birthday should be visible or not */
	@Property({ onCreate: () => true })
	birthday = true;

	/** Wether the user nickname should be visible or not */
	@Property({ onCreate: () => true })
	nickname = true;

	/** Wether the user gender should be visible or not */
	@Property({ onCreate: () => false })
	gender = false;

	/** Wether the user cursus should be visible or not */
	@Property({ onCreate: () => true })
	cursus = true;

	/** Wether the user promotion should be visible or not */
	@Property({ onCreate: () => true })
	promotion = true;

	/** Wether the user phone should be visible or not */
	@Property({ onCreate: () => false })
	phone = false;

	/** Wether the user parent's contact should be visible or not */
	@Property({ onCreate: () => false })
	parent_contact = false;
}
