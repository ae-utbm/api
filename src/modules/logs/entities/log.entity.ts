import type { LogEntity } from '@types';

import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'users_logs' })
export class Log extends BaseEntity implements LogEntity<User> {
	@ManyToOne()
	@ApiProperty({ type: Number })
	user: User;

	@Property()
	@ApiProperty()
	action: string;

	@Property()
	@ApiProperty()
	ip: string;

	@Property()
	@ApiProperty()
	user_agent: string;

	@Property()
	@ApiProperty()
	route: string;

	@Property()
	@ApiProperty()
	method: string;

	@Property()
	@ApiProperty()
	body: string;

	@Property()
	@ApiProperty()
	query: string;

	@Property()
	@ApiProperty()
	params: string;

	@Property()
	@ApiProperty({ required: false })
	response?: string;

	@Property()
	@ApiProperty({ required: false })
	status_code?: number;

	@Property({ nullable: true })
	@ApiProperty({ required: false })
	error?: string;

	@Property({ nullable: true })
	@ApiProperty({ required: false })
	error_stack?: string;

	@Property({ nullable: true })
	@ApiProperty({ required: false })
	error_message?: string;
}
