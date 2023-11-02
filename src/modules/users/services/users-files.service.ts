import { join } from 'path';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { env } from '@env';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';

import { UsersDataService } from './users-data.service';
import { UserGetBannerDTO, UserGetPictureDTO } from '../dto/get.dto';
import { UserBanner } from '../entities/user-banner.entity';
import { UserPicture } from '../entities/user-picture.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersFilesService {
	constructor(
		private readonly t: TranslateService,
		private readonly orm: MikroORM,
		private readonly filesService: FilesService,
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
	async updatePicture(req_user: User, owner_id: number, file: Express.Multer.File): Promise<UserGetPictureDTO> {
		const user = await this.orm.em.findOne(User, { id: owner_id }, { populate: ['picture'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, owner_id));

		if (req_user.id === user.id && user.picture !== null) {
			const cooldown = env.USERS_PICTURES_DELAY;
			const now = Date.now();

			if (
				!(await this.dataService.hasPermissionOrRoleWithPermission(user.id, false, ['CAN_EDIT_USER'])) &&
				user.picture.updated.getTime() + cooldown > now
			) {
				// Throw error if cooldown is not yet passed
				throw new UnauthorizedException(
					this.t.Errors.User.PictureCooldown(user.picture.updated.getTime() + cooldown - now),
				);
			}
		}

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(env.USERS_BASE_PATH, 'pictures'),
			filename: user.full_name.toLowerCase().replaceAll(' ', '_'),
			aspect_ratio: '1:1',
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
		return user.picture.toObject() as unknown as UserGetPictureDTO;
	}

	@CreateRequestContext()
	async getPicture(id: number): Promise<UserPicture> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['picture', 'picture.visibility'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));
		if (!user.picture) throw new NotFoundException(this.t.Errors.User.NoPicture(id));

		return user.picture;
	}

	@CreateRequestContext()
	async deletePicture(id: number): Promise<MessageResponseDTO> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['picture'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));
		if (!user.picture) throw new NotFoundException(this.t.Errors.User.NoPicture(id));

		this.filesService.deleteFromDisk(user.picture);
		await this.orm.em.removeAndFlush(user.picture);

		return { message: this.t.Success.Entity.Deleted(UserPicture), statusCode: 201 };
	}

	@CreateRequestContext()
	async updateBanner(id: number, file: Express.Multer.File): Promise<UserGetBannerDTO> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(env.USERS_BASE_PATH, 'banners'),
			filename: user.full_name.replaceAll(' ', '_'),
			aspect_ratio: '16:9',
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
		return user.banner.toObject() as unknown as UserGetBannerDTO;
	}

	@CreateRequestContext()
	async getBanner(id: number): Promise<UserBanner> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner', 'banner.visibility'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));
		if (!user.banner) throw new NotFoundException(this.t.Errors.User.NoBanner(id));

		return user.banner;
	}

	@CreateRequestContext()
	async deleteBanner(id: number): Promise<MessageResponseDTO> {
		const user = await this.orm.em.findOne(User, { id }, { populate: ['banner'] });
		if (!user) throw new NotFoundException(this.t.Errors.Id.NotFound(User, id));
		if (!user.banner) throw new NotFoundException(this.t.Errors.User.NoBanner(id));

		this.filesService.deleteFromDisk(user.banner);
		await this.orm.em.removeAndFlush(user.banner);

		return { message: this.t.Success.Entity.Deleted(UserBanner), statusCode: 201 };
	}
}
