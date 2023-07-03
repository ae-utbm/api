import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { convertToWebp, isBannerAspectRation, isSquare } from '@utils/images';

import { UserPostByAdminDTO, UserPostDTO } from '@modules/auth/dto/register.dto';
import { UserPatchDTO } from './dto/patch.dto';
import { User } from '@modules/users/entities/user.entity';
import { UserBanner } from '@modules/users/entities/user-banner.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { checkEmail } from '@utils/email';
import { checkBirthday } from '@utils/dates';

import { join } from 'path';
import fs from 'fs';

@Injectable()
export class UsersService {
	constructor(private readonly configService: ConfigService, private readonly orm: MikroORM) {}

	@UseRequestContext()
	public async checkVisibility(user: User): Promise<Partial<User>> {
		const visibility = await this.orm.em.findOneOrFail(UserVisibility, { user });

		for (const key in visibility) {
			if (visibility[key] === false) user[key] = undefined;
		}

		return user;
	}

	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>): Promise<Partial<User>>;
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter: false): Promise<User>;

	@UseRequestContext()
	async findOne({ id, email }: Partial<Pick<User, 'id' | 'email'>>, filter = true): Promise<User | Partial<User>> {
		let user: User = null;

		if (id) user = await this.orm.em.findOne(User, { id });
		if (email) user = await this.orm.em.findOne(User, { email });

		if (!id && !email) throw new BadRequestException('Missing user id/email');
		if (!user) throw new NotFoundException('User not found');

		return filter ? await this.checkVisibility(user) : user;
	}

	@UseRequestContext()
	async findVisibility({ id }: Partial<Pick<User, 'id'>>): Promise<UserVisibility> {
		const user = await this.orm.em.findOne(User, { id });
		if (!user) throw new NotFoundException('User not found');

		return await this.orm.em.findOne(UserVisibility, { user });
	}

	@UseRequestContext()
	async findAll(filter = true) {
		const users = await this.orm.em.find(User, {});
		if (filter) return users.map(async (user) => await this.checkVisibility(user));

		return users;
	}

	// TODO: send a confirmation email to the user
	@UseRequestContext()
	async register(input: UserPostDTO): Promise<User> {
		if (!checkEmail(input.email)) throw new BadRequestException(`The email '${input.email}' is not allowed`);
		if (!checkBirthday(input.birthday)) throw new BadRequestException(`The date '${input.birthday}' is not valid`);

		const user = this.orm.em.create(User, input);
		this.orm.em.create(UserVisibility, { user });

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	// TODO: send a confirmation email with the random password to both activate & ask the user to change it
	@UseRequestContext()
	async registerByAdmin(input: UserPostByAdminDTO): Promise<User> {
		if (!checkEmail(input.email)) throw new BadRequestException(`The email '${input.email}' is not allowed`);
		if (!checkBirthday(input.birthday)) throw new BadRequestException(`The date '${input.birthday}' is not valid`);

		// TODO : generate random password
		const final = { ...input, password: 'TOTO' };
		const user = this.orm.em.create(User, final);
		this.orm.em.create(UserVisibility, { user });

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async update(requestUser: number, input: UserPatchDTO) {
		const user = await this.findOne({ id: input.id }, false);

		if (!user) throw new NotFoundException('User not found');

		if (!checkEmail(input.email)) throw new BadRequestException(`The email '${input.email}' is not allowed`);

		if (input.hasOwnProperty('birthday')) {
			const currentUser = await this.findOne({ id: requestUser }, false);

			if (currentUser.id === user.id)
				throw new UnauthorizedException(
					'You cannot update your own birthday, ask another user with the appropriate permission',
				);

			// if (!checkPermission(currentUser, 'CAN_UPDATE_USER'))
			// 	throw new UnauthorizedException('You do not have permission to update the birthday');
		}

		Object.assign(user, input);
		user.updated_at = new Date();

		await this.orm.em.persistAndFlush(user);
		return user;
	}

	@UseRequestContext()
	async updatePicture({ id, file }: { id: number; file: Express.Multer.File }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['*', 'picture'] });

		// TODO: add a check to autorise the user to change his picture if he has the associated permission
		// -> the user needs to be the one sending the request, not the one targeted by the request
		if (
			user.picture &&
			0 <
				this.configService.get<number>('files.usersPicturesDelay') * 1000 -
					(new Date().getTime() - new Date(user.picture.updated_at).getTime())
		)
			throw new UnauthorizedException('You can only change your picture once a week');

		const { buffer, mimetype } = file;
		const imageDir = join(this.configService.get<string>('files.users'), 'pictures');
		const extension = mimetype.replace('image/', '.');
		const filename = `${user.id}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		// test if the image is square
		if (!isSquare(imagePath)) {
			fs.unlinkSync(imagePath);
			throw new BadRequestException('The user picture must be square');
		}

		// remove the old picture (if any)
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
			user.picture.mimetype = 'image/webp';
			user.picture.updated_at = new Date();
			user.picture.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(user);
	}

	@UseRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture');
		return user.picture;
	}

	@UseRequestContext()
	async deletePicture(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture to be deleted');

		fs.unlinkSync(user.picture.path);
		await this.orm.em.removeAndFlush(user.picture);
	}

	@UseRequestContext()
	async updateBanner({ id, file }: { id: number; file: Express.Multer.File }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['*', 'banner'] });

		const { buffer, mimetype } = file;
		const imageDir = join(this.configService.get<string>('files.users'), 'banners');
		const extension = mimetype.replace('image/', '.');
		const filename = `${user.id}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		// test if the image is square
		if (!isBannerAspectRation(imagePath)) {
			fs.unlinkSync(imagePath);
			throw new BadRequestException('The image must be of 1:3 aspect ratio');
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
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner');

		return user.banner;
	}

	@UseRequestContext()
	async deleteBanner(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner to be deleted');

		fs.unlinkSync(user.banner.path);
		await this.orm.em.removeAndFlush(user.banner);
	}

	@UseRequestContext()
	async delete(id: number) {
		const user = await this.orm.em.findOne(User, { id });
		await this.orm.em.removeAndFlush(user);
	}

	@UseRequestContext()
	async getUserRoles(id: number, input: { show_expired: boolean; show_revoked: boolean }) {
		const user = await this.orm.em.findOneOrFail(User, { id }, { fields: ['roles'] });
		const roles = user.roles.getItems();

		if (!input.show_expired) roles.filter((p) => p.expires > new Date());
		if (!input.show_revoked) roles.filter((p) => p.revoked === false);

		return roles;
	}
}
