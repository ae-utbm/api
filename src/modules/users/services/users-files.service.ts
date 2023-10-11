import { join } from 'path';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';

import { UserBanner } from '../entities/user-banner.entity';
import { UserPicture } from '../entities/user-picture.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersFilesService {
	constructor(
		private readonly t: TranslateService,
		private readonly orm: MikroORM,
		private readonly filesService: FilesService,
		private readonly configService: ConfigService,
	) {}

	@CreateRequestContext()
	async updatePicture(id: number, file: Express.Multer.File): Promise<User> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['picture'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(this.configService.get<string>('files.users'), 'pictures'),
			filename: user.full_name.replaceAll(' ', '_'),
			aspectRatio: '1:1',
		});

		// Remove old file if present
		if (user.picture) {
			this.filesService.deleteFromDisk(user.picture);

			user.picture.filename = fileInfos.filename;
			user.picture.mimetype = fileInfos.mimetype;
			user.picture.description = `Picture of ${user.full_name}`;
			user.picture.path = fileInfos.filepath;
			user.picture.size = fileInfos.size;

			await this.orm.em.persistAndFlush(user.picture);
		} else
			user.picture = this.orm.em.create(UserPicture, {
				filename: fileInfos.filename,
				mimetype: fileInfos.mimetype,
				description: `Picture of ${user.full_name}`,
				path: fileInfos.filepath,
				picture_user: user,
				size: fileInfos.size,
				visibility: await this.filesService.getVisibilityGroup(),
			});

		await this.orm.em.persistAndFlush(user);

		delete user.picture.picture_user; // avoid circular reference
		return user;
	}

	@CreateRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture');
		return user.picture;
	}

	@CreateRequestContext()
	async deletePicture(id: number): Promise<void> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['picture'] });
		if (!user.picture) throw new NotFoundException('User has no picture to be deleted');

		this.filesService.deleteFromDisk(user.picture);
		await this.orm.em.removeAndFlush(user.picture);
	}

	@CreateRequestContext()
	async updateBanner(id: number, file: Express.Multer.File): Promise<User> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(this.configService.get<string>('files.users'), 'banners'),
			filename: user.full_name.replaceAll(' ', '_'),
			aspectRatio: '16:9',
		});

		// Remove old file if present
		if (user.banner) {
			this.filesService.deleteFromDisk(user.banner);

			user.banner.filename = fileInfos.filename;
			user.banner.mimetype = fileInfos.mimetype;
			user.banner.description = `Banner of ${user.full_name}`;
			user.banner.path = fileInfos.filepath;
			user.banner.size = fileInfos.size;

			await this.orm.em.persistAndFlush(user.banner);
		} else
			user.banner = this.orm.em.create(UserBanner, {
				filename: fileInfos.filename,
				mimetype: fileInfos.mimetype,
				description: `Banner of ${user.full_name}`,
				path: fileInfos.filepath,
				banner_user: user,
				size: fileInfos.size,
				visibility: await this.filesService.getVisibilityGroup(),
			});

		await this.orm.em.persistAndFlush(user);

		delete user.banner.banner_user; // avoid circular reference
		return user;
	}

	@CreateRequestContext()
	async getBanner(id: number): Promise<UserBanner> {
		const user = await this.orm.em.findOneOrFail(User, { id }, { populate: ['banner'] });
		if (!user.banner) throw new NotFoundException('User has no banner');
		return user.banner;
	}

	@CreateRequestContext()
	async deleteBanner(id: number): Promise<void> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));
		if (!user.banner) throw new NotFoundException('User has no banner to be deleted');

		this.filesService.deleteFromDisk(user.banner);
		await this.orm.em.removeAndFlush(user.banner);
	}
}
