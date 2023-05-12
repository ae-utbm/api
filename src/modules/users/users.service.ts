import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserVisibility } from './entities/user-visibility.entity';
import { UserGroupedObject } from './models/user-grouped.object';
import { UserEditArgs } from './models/user-edit.args';
import { UserRegisterArgs } from './models/user-register.args';
import { UserEditImageArgs } from './models/user-edit-picture.args';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { UserPicture } from './entities/user-picture.entity';
import { UserBanner } from './entities/user-banner.entity';
import { convertToWebp, isBannerAspectRation, isSquare } from '@utils/images';
import { UserObject } from './models/user.object';

import fs from 'fs';

@Injectable()
export class UsersService {
	constructor(private readonly configService: ConfigService, private readonly orm: MikroORM) {}

	public async convertToUserGrouped(user: User): Promise<UserGroupedObject> {
		const userObj = await this.convertToUserObject(user);
		const output: Required<UserGroupedObject> = {
			first_name: userObj.first_name,
			last_name: userObj.last_name,
			nickname: userObj.nickname,
			promotion: userObj.promotion,
			id: userObj.id,
			created: userObj.created,
			updated: userObj.updated,
		};

		return output;
	}

	@UseRequestContext()
	public async convertToUserObject(user: User): Promise<UserObject> {
		const visibility = await this.orm.em.findOneOrFail(UserVisibility, { user });
		const output: Required<UserObject> = {
			first_name: user.first_name,
			last_name: user.last_name,
			id: user.id,
			created: user.created,
			updated: user.updated,
			last_seen: user.last_seen,
			subscriber_account: user.subscriber_account,
			cursus: visibility.cursus ? user.cursus : undefined,
			promotion: visibility.promotion && user.promotion ? user.promotion.id : undefined,
			email: visibility.email ? user.email : undefined,
			birthday: visibility.birthday ? user.birthday : undefined,
			nickname: visibility.nickname ? user.nickname : undefined,
			gender: visibility.gender ? user.gender : undefined,
			pronouns: visibility.pronouns ? user.pronouns : undefined,
			specialty: visibility.specialty ? user.specialty : undefined,
			subscription: user.current_subscription ? user.current_subscription.expires : undefined,
		};

		return output;
	}

	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter?: true): Promise<UserObject>;
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter?: false): Promise<User>;

	@UseRequestContext()
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter = true): Promise<User | UserObject> {
		if (id) {
			if (filter) return this.convertToUserObject(await this.orm.em.findOneOrFail(User, { id }));
			return this.orm.em.findOneOrFail(User, { id });
		}
		if (email) {
			if (filter) return this.convertToUserObject(await this.orm.em.findOneOrFail(User, { email }));
			return this.orm.em.findOneOrFail(User, { email });
		}

		if (!id && !email) throw new HttpException('Missing id or email', HttpStatus.BAD_REQUEST);
	}

	@UseRequestContext()
	async findAll() {
		return (await this.orm.em.find(User, {})).map(async (user) => await this.convertToUserGrouped(user));
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

	@UseRequestContext()
	async updatePicture(input: UserEditImageArgs) {
		const user = await this.orm.em.findOneOrFail(User, { id: input.id });

		if (
			user.picture &&
			user.picture.updated < new Date(Date.now() - this.configService.get<number>('files.usersPicturesDelay') * 1000)
		)
			throw new HttpException('You can only change your picture once a week', HttpStatus.FORBIDDEN);

		const { createReadStream, filename, mimetype } = await input.image;
		const imagePath = join(
			process.cwd(),
			this.configService.get<string>('files.usersPictures'),
			`${user.full_name}_${filename}`,
		);

		return new Promise(async (resolve) => {
			createReadStream()
				// Upload default image to manipulate it
				.pipe(fs.createWriteStream(imagePath))
				.on('finish', async () => {
					if (!isSquare(imagePath)) {
						fs.unlinkSync(imagePath);
						return new HttpException('The image must be square', HttpStatus.BAD_REQUEST);
					}
				})
				.on('error', () => new HttpException('Error while saving the picture', HttpStatus.BAD_REQUEST))

				// Reupload the image in webp format (or GIF if it's a GIF)
				.pipe(fs.createWriteStream(await convertToWebp(imagePath)))
				.on('finish', async () => {
					if (user.picture) {
						if (imagePath !== user.picture.path) fs.unlinkSync(user.picture.path); // remove on disk
						await this.orm.em.removeAndFlush(user.picture); // remove in database
					}

					this.orm.em.create(UserPicture, {
						filename,
						mimetype,
						path: imagePath,
						user,
					});

					resolve({ filename, mimetype });
				})
				.on('error', () => new HttpException('Error while saving the picture', HttpStatus.BAD_REQUEST));
		});
	}

	@UseRequestContext()
	async updateBanner(input: UserEditImageArgs) {
		const user = await this.orm.em.findOneOrFail(User, { id: input.id });

		const { createReadStream, filename, mimetype } = await input.image;
		const imagePath = join(
			process.cwd(),
			this.configService.get<string>('files.usersBanners'),
			`${user.full_name}_${filename}`,
		);

		return new Promise(async (resolve) => {
			createReadStream()
				// Upload default image to manipulate it
				.pipe(fs.createWriteStream(imagePath))
				.on('finish', async () => {
					if (!isBannerAspectRation(imagePath)) {
						fs.unlinkSync(imagePath);
						return new HttpException('The image must have a 1:3 aspect ration', HttpStatus.BAD_REQUEST);
					}
				})
				.on('error', () => new HttpException('Error while saving the banner', HttpStatus.BAD_REQUEST))

				// Reupload the image in webp format (or GIF if it's a GIF)
				.pipe(fs.createWriteStream(await convertToWebp(imagePath)))
				.on('finish', async () => {
					if (user.banner) {
						if (imagePath !== user.banner.path) fs.unlinkSync(user.banner.path); // remove on disk
						await this.orm.em.removeAndFlush(user.banner); // remove in database
					}

					this.orm.em.create(UserBanner, {
						filename,
						mimetype,
						path: imagePath,
						user,
					});

					resolve({ filename, mimetype });
				})
				.on('error', () => new HttpException('Error while saving the banner', HttpStatus.BAD_REQUEST));
		});
	}

	@UseRequestContext()
	async delete(user: User) {
		await this.orm.em.removeAndFlush(user);
	}
}
