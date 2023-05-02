import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserObject } from './models/user.model';

@Injectable()
export class UsersService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async findOne({ id, email }: Partial<User>) {
		if (id) return this.orm.em.findOneOrFail(User, { id });
		if (email) return this.orm.em.findOneOrFail(User, { email });
	}

	@UseRequestContext()
	async findAll() {
		return this.orm.em.find(User, {});
	}

	@UseRequestContext()
	async create(input: Partial<User> & Required<Pick<User, 'password' | 'email'>>): Promise<User> {
		const user = this.orm.em.create(User, input);
		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async update(input: UserObject) {
		const user = await this.findOne({ id: input.id });
		Object.assign(user, input); // TODO: use merge ?
		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async delete(user: User) {
		await this.orm.em.removeAndFlush(user);
	}
}
