import type { SubscriptionEntity } from '#types/api';

import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'subscriptions' })
export class Subscription extends BaseEntity implements SubscriptionEntity<User> {
	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	@ApiProperty({ type: Number })
	user: User;

	@Property()
	@ApiProperty()
	plan: string;

	@Property({ type: 'date' })
	@ApiProperty()
	expires: Date;

	/** Determine if the subscription is still active by comparing current date with the subscription date */
	@Property({ persist: false })
	get is_active(): boolean {
		return this.expires > new Date();
	}
}
