import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async create(createUserInput: Partial<User>) {
		const user = this.orm.em.create(User, createUserInput);
		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async findOne({ id, email }: Partial<User>) {
		if (id) return this.orm.em.findOne(User, { id });
		if (email) return this.orm.em.findOne(User, { email });
	}
}
