import { join } from 'path';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { env } from '@env';
import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { i18nNotFoundException, i18nUnauthorizedException } from '@modules/base/http-errors';
import { ImagesService } from '@modules/files/images.service';

import { UsersDataService } from './users-data.service';
import { OutputUserBannerDTO, OutputUserPictureDTO } from '../dto/output.dto';
import { UserBanner } from '../entities/user-banner.entity';
import { UserPicture } from '../entities/user-picture.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersFilesService {
	constructor(
		private readonly orm: MikroORM,
		private readonly imagesService: ImagesService,
		private readonly dataService: UsersDataService,
	) {}

	/**
	 * Edit user profile picture
	 * @param {User} req_user User making the request
	 * @param {number} owner_id User id to whom the picture belongs
	 * @param {Express.Multer.File} file The picture file
	 * @returns {Promise<User>} The updated user
	 */
	@CreateRequestContext()
	async updatePicture(req_user: User, owner_id: number, file: Express.Multer.File): Promise<OutputUserPictureDTO> {
		const user = await this.orm.em.findOne(User, { id: owner_id }, { populate: ['picture'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id: owner_id });

		if (req_user.id === user.id && user.picture !== null) {
			const cooldown = env.USERS_PICTURES_DELAY;
			const now = Date.now();

			if (
				!(await this.dataService.hasPermissionOrRoleWithPermission(req_user.id, false, ['CAN_EDIT_USER'])) &&
				user.picture.updated.getTime() + cooldown >= now
			) {
				// Throw error if cooldown is not yet passed
				throw new i18nUnauthorizedException('validations.user.picture.cooldown', {
					days: cooldown / 1000 / 60 / 60 / 24,
				});
			}
		}

		const fileInfos = await this.imagesService.writeOnDisk(file.buffer, {
			directory: join(env.USERS_BASE_PATH, 'pictures'),
			filename: user.full_name.toLowerCase().replaceAll(' ', '_'),
			aspect_ratio: '1:1',
		});

		// Remove old file if present
		if (user.picture) {
			this.imagesService.deleteFromDisk(user.picture);

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
				visibility: await this.imagesService.getVisibilityGroup(),
			});

		await this.orm.em.persistAndFlush(user);
		return user.picture.toObject() as unknown as OutputUserPictureDTO;
	}

	@CreateRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['picture', 'picture.visibility'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });
		if (!user.picture) throw new i18nNotFoundException('validations.user.picture.not_found', { name: user.full_name });

		return user.picture;
	}

	@CreateRequestContext()
	async deletePicture(id: number): Promise<OutputMessageDTO> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['picture'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });
		if (!user.picture) throw new i18nNotFoundException('validations.user.picture.not_found', { name: user.full_name });

		this.imagesService.deleteFromDisk(user.picture);
		await this.orm.em.removeAndFlush(user.picture);

		return new OutputMessageDTO('validations.user.success.deleted_picture', { name: user.full_name });
	}

	@CreateRequestContext()
	async updateBanner(id: number, file: Express.Multer.File): Promise<OutputUserBannerDTO> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });

		const fileInfos = await this.imagesService.writeOnDisk(file.buffer, {
			directory: join(env.USERS_BASE_PATH, 'banners'),
			filename: user.full_name.replaceAll(' ', '_'),
			aspect_ratio: '16:9',
		});

		// Remove old file if present
		if (user.banner) {
			this.imagesService.deleteFromDisk(user.banner);

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
				visibility: await this.imagesService.getVisibilityGroup(),
			});

		await this.orm.em.persistAndFlush(user);
		return user.banner.toObject() as unknown as OutputUserBannerDTO;
	}

	@CreateRequestContext()
	async getBanner(id: number): Promise<UserBanner> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner', 'banner.visibility'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });
		if (!user.banner) throw new i18nNotFoundException('validations.user.banner.not_found', { name: user.full_name });

		return user.banner;
	}

	@CreateRequestContext()
	async deleteBanner(id: number): Promise<OutputMessageDTO> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new i18nNotFoundException('validations.user.not_found.id', { id });
		if (!user.banner) throw new i18nNotFoundException('validations.user.banner.not_found', { name: user.full_name });

		this.imagesService.deleteFromDisk(user.banner);
		await this.orm.em.removeAndFlush(user.banner);

		return new OutputMessageDTO('validations.user.success.deleted_banner', { name: user.full_name });
	}
}
