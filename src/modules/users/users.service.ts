import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserVisibility } from './entities/user-visibility.entity';
import { UserGroupedObject } from './models/user-grouped.object';
import { UserEditArgs } from './models/user-edit.args';

@Injectable()
export class UsersService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	private async filterUser(user: User): Promise<Partial<User>> {
		const visibility = await this.orm.em.findOneOrFail(UserVisibility, { user });

		if (!visibility.birthday) delete user.birthday;
		if (!visibility.email) delete user.email;
		if (!visibility.gender) delete user.gender;
		if (!visibility.nickname) delete user.nickname;

		return user;
	}

	async findOne({ id, email }: Partial<User>, filter?: true): Promise<Partial<User>>;
	async findOne({ id, email }: Partial<User>, filter?: false): Promise<User>;

	// TODO refactor this
	@UseRequestContext()
	async findOne({ id, email }: Partial<User>, filter = true): Promise<User | Partial<User>> {
		if (id) {
			if (filter) return this.filterUser(await this.orm.em.findOneOrFail(User, { id }));
			return this.orm.em.findOneOrFail(User, { id });
		}
		if (email) {
			if (filter) return this.filterUser(await this.orm.em.findOneOrFail(User, { email }));
			return this.orm.em.findOneOrFail(User, { email });
		}
	}

	@UseRequestContext()
	async findAll() {
		return (await this.orm.em.find(User, {})).map((user) => {
			const userGrouped = new UserGroupedObject();
			userGrouped.id = user.id;
			userGrouped.first_name = user.first_name;
			userGrouped.last_name = user.last_name;
			userGrouped.promotion = user.promotion;
			userGrouped.created = user.created;
			userGrouped.updated = user.updated;

			return userGrouped;
		});
	}

	@UseRequestContext()
	async create(input: Partial<User> & Required<Pick<User, 'password' | 'email'>>): Promise<User> {
		const user = this.orm.em.create(User, input);
		this.orm.em.create(UserVisibility, { user });

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async update(input: UserEditArgs) {
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
