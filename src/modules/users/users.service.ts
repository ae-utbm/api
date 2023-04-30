import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async create(input: Partial<User> & Required<Pick<User, 'password' | 'email'>>): Promise<User> {
		const user = this.orm.em.create(User, input);
		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async findOne({ id, email }: Partial<User>) {
		if (id) return this.orm.em.findOne(User, { id });
		if (email) return this.orm.em.findOne(User, { email });
	}
}
