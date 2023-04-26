import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(@InjectRepository(User) private readonly usersRepository: EntityRepository<User>) {}

	async create(createUserInput: Partial<User>) {
		const user = this.usersRepository.create(createUserInput);
		await this.usersRepository.persistAndFlush(user);
		return user;
	}

	async findOne({ id, email }: Partial<User>) {
		if (id) return this.usersRepository.findOne({ id });
		if (email) return this.usersRepository.findOne({ email });
	}
}
