import { BaseEntity } from '@database/entities/base.entity';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'subscriptions' })
export class Subscription extends BaseEntity {
	/** Specify to which user the subscription is attached */
	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	user: User;

	@Property()
	plan: string;

	@Property({ type: 'date' })
	expires: Date;

	@Property({ persist: false })
	get is_active(): boolean {
		return this.expires > new Date();
	}
}
