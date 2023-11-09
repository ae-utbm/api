import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { BaseEntity } from '@modules/base/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'users_logs' })
export class Log extends BaseEntity {
	@ManyToOne(() => User, { serializedName: 'user_id', serializer: (u: User) => u.id })
	user: User;

	@Property()
	action: string;

	@Property()
	ip: string;

	@Property()
	user_agent: string;

	@Property()
	route: string;

	@Property()
	method: string;

	@Property()
	body: string;

	@Property()
	query: string;

	@Property()
	params: string;

	@Property()
	response?: string;

	@Property()
	status_code?: number;

	@Property({ nullable: true })
	error?: string;

	@Property({ nullable: true })
	error_stack?: string;

	@Property({ nullable: true })
	error_message?: string;
}
