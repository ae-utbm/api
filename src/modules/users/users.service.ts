import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserVisibility } from './entities/user-visibility.entity';
import { UserGroupedObject } from './models/user-grouped.object';
import { UserEditArgs } from './models/user-edit.args';
import { UserRegisterArgs } from './models/user-register.args';
import { UserEditImageArgs } from './models/user-edit-picture.args';
import { createWriteStream } from 'fs';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { UserPicture } from './entities/user-picture.entity';
import { UserBanner } from './entities/user-banner.entity';

@Injectable()
export class UsersService {
	constructor(private readonly configService: ConfigService, private readonly orm: MikroORM) {}

	// TODO update the user visibility (fields have been added)
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

	// TODO: send a confirmation email to the user
	@UseRequestContext()
	async create(input: UserRegisterArgs): Promise<User> {
		const user = this.orm.em.create(User, input);
		this.orm.em.create(UserVisibility, { user });

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async update(input: UserEditArgs) {
		const user = await this.findOne({ id: input.id });
		Object.assign(user, input);
		await this.orm.em.persistAndFlush(user);
		return user;
	}

	// TODO: verify that the image is a supported format
	// TODO: verify that the image is square
	// TODO: fails if the last image is less than 7d old
	// TODO: should erase the last image
	// TODO: compress the image
	@UseRequestContext()
	async updatePicture(input: UserEditImageArgs) {
		const { createReadStream, filename, mimetype } = await input.image;

		return new Promise(async (resolve) => {
			createReadStream()
				.pipe(createWriteStream(join(this.configService.get('USERS_PICTURES_PATH'), filename)))
				.on('finish', async () => {
					this.orm.em.create(UserPicture, {
						filename,
						mimetype,
						path: join(this.configService.get('USERS_PICTURES_PATH'), filename),
						user: await this.orm.em.findOneOrFail(User, { id: input.id }),
					});

					resolve({ filename, mimetype });
				})
				.on('error', () => new HttpException('Error while saving the picture', HttpStatus.BAD_REQUEST));
		});
	}

	// TODO: verify that the image is a supported format
	// TODO: verify that the image is square
	// TODO: should erase the last image
	// TODO: compress the image
	@UseRequestContext()
	async updateBanner(input: UserEditImageArgs) {
		const { createReadStream, filename, mimetype } = await input.image;

		return new Promise(async (resolve) => {
			createReadStream()
				.pipe(createWriteStream(join(this.configService.get('USERS_PICTURES_PATH'), filename)))
				.on('finish', async () => {
					this.orm.em.create(UserBanner, {
						filename,
						mimetype,
						path: join(this.configService.get('USERS_PICTURES_PATH'), filename),
						user: await this.orm.em.findOneOrFail(User, { id: input.id }),
					});

					resolve({ filename, mimetype });
				})
				.on('error', () => new HttpException('Error while saving the picture', HttpStatus.BAD_REQUEST));
		});
	}

	@UseRequestContext()
	async delete(user: User) {
		await this.orm.em.removeAndFlush(user);
	}
}
