import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserVisibility } from './entities/user-visibility.entity';
import { UserGroupedObject } from './models/user-grouped.object';
import { UserEditArgs } from './models/user-edit.args';
import { UserRegisterArgs } from './models/user-register.args';
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
			// base user
			id: user.id,
			first_name: user.first_name,
			last_name: user.last_name,
			last_seen: user.last_seen,
			created: user.created,
			updated: user.updated,

			// user details
			birthday: visibility.birthday ? user.birthday : undefined,
			cursus: visibility.cursus ? user.cursus : undefined,
			email: visibility.email ? user.email : undefined,
			gender: visibility.gender ? user.gender : undefined,
			nickname: visibility.nickname ? user.nickname : undefined,
			parent_contact: visibility.parent_contact ? user.parent_contact : undefined,
			phone: visibility.phone ? user.phone : undefined,
			promotion: visibility.promotion && user.promotion ? user.promotion.id : undefined,
			pronouns: visibility.pronouns ? user.pronouns : undefined,
			secondary_email: visibility.secondary_email ? user.secondary_email : undefined,
			specialty: visibility.specialty ? user.specialty : undefined,
			subscriber_account: user.subscriber_account,
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
	async updatePicture({ id, file }: { id: number; file: Express.Multer.File }) {
		const user = await this.orm.em.findOneOrFail(User, { id });
		if (user.picture) await user.picture.init();

		if (
			user.picture &&
			0 <
				this.configService.get<number>('files.usersPicturesDelay') * 1000 -
					(new Date().getTime() - new Date(user.picture.updated).getTime())
		)
			throw new HttpException('You can only change your picture once a week', HttpStatus.FORBIDDEN);

		const { buffer, mimetype } = file;
		const imageDir = this.configService.get<string>('files.usersPictures');
		const extension = mimetype.replace('image/', '.');
		const filename = `${user.id}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		// test if the image is square
		if (!isSquare(imagePath)) {
			fs.unlinkSync(imagePath);
			throw new HttpException('The image must be square', HttpStatus.BAD_REQUEST);
		}

		// remove old picture if path differs
		if (user.picture && user.picture.path && user.picture.path !== imagePath) fs.unlinkSync(user.picture.path);

		// convert to webp
		fs.createWriteStream(await convertToWebp(imagePath));

		// update database
		if (!user.picture)
			user.picture = this.orm.em.create(UserPicture, {
				filename,
				mimetype,
				path: imagePath.replace(extension, '.webp'),
				user,
			});
		else {
			user.picture.filename = filename;
			user.picture.mimetype = mimetype;
			user.picture.updated = new Date();
			user.picture.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(user);
	}

	@UseRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOneOrFail(User, { id });
		if (!user.picture) throw new HttpException('User has no picture', HttpStatus.NOT_FOUND);

		await user.picture.init();

		return user.picture;
	}

	@UseRequestContext()
	async deletePicture(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id });
		if (user.picture) await user.picture.init();

		if (user.picture) {
			fs.unlinkSync(user.picture.path);
			await this.orm.em.removeAndFlush(user.picture);
		}
	}

	@UseRequestContext()
	async updateBanner({ id, file }: { id: number; file: Express.Multer.File }) {
		const user = await this.orm.em.findOneOrFail(User, { id });
		await user.picture.init();

		const { buffer, mimetype } = file;
		const imageDir = this.configService.get<string>('files.usersBanners');
		const extension = mimetype.replace('image/', '.');
		const filename = `${user.id}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		// test if the image is square
		if (!isBannerAspectRation(imagePath)) {
			fs.unlinkSync(imagePath);
			throw new HttpException('The image must be of 1:3 aspect ratio', HttpStatus.BAD_REQUEST);
		}

		// remove old banner if path differs
		if (user.banner && user.banner.path && user.banner.path !== imagePath) fs.unlinkSync(user.banner.path);

		// convert to webp
		fs.createWriteStream(await convertToWebp(imagePath));

		// update database
		if (!user.banner)
			user.banner = this.orm.em.create(UserBanner, {
				filename,
				mimetype,
				path: imagePath.replace(extension, '.webp'),
				user,
			});
		else {
			user.banner.filename = filename;
			user.banner.mimetype = mimetype;
			user.banner.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(user);
	}

	@UseRequestContext()
	async getBanner(id: number): Promise<UserBanner> {
		const user = await this.orm.em.findOneOrFail(User, { id });
		if (!user.banner) throw new HttpException('User has no banner', HttpStatus.NOT_FOUND);

		await user.banner.init();
		return user.banner;
	}

	@UseRequestContext()
	async deleteBanner(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id });
		if (user.banner) await user.banner.init();

		if (user.banner) {
			fs.unlinkSync(user.banner.path);
			await this.orm.em.removeAndFlush(user.banner);
		}
	}

	@UseRequestContext()
	async delete(user: User) {
		await this.orm.em.removeAndFlush(user);
	}
}
