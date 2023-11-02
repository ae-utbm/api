import { join } from 'path';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { env } from '@env';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';

import { PromotionPictureResponseDTO, PromotionResponseDTO } from './dto/get.dto';
import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { BaseUserResponseDTO } from '../users/dto/base-user.dto';

@Injectable()
export class PromotionsService {
	constructor(
		private readonly t: TranslateService,
		private readonly orm: MikroORM,
		private readonly filesService: FilesService,
	) {}

	/**
	 * Create a new promotion each year on the 15th of July
	 */
	@Cron('0 0 0 15 7 *')
	@CreateRequestContext()
	async createNewPromotion(): Promise<void> {
		const latest = await this.findLatest();
		const newPromotion = this.orm.em.create(Promotion, { number: latest.number + 1 });

		await this.orm.em.persistAndFlush(newPromotion);
	}

	@CreateRequestContext()
	async findAll(): Promise<PromotionResponseDTO[]> {
		return (await this.orm.em.find(Promotion, {}, { fields: ['*', 'users'] })).map(
			(p) => p.toObject() as unknown as PromotionResponseDTO,
		);
	}

	@CreateRequestContext()
	async findLatest(): Promise<PromotionResponseDTO> {
		const promotion = (
			await this.orm.em.find(
				Promotion,
				{},
				{ orderBy: { number: 'DESC' }, limit: 1, fields: ['*', 'picture', 'users'] },
			)
		)[0];
		return promotion.toObject() as unknown as PromotionResponseDTO;
	}

	@CreateRequestContext()
	async findCurrent(): Promise<PromotionResponseDTO[]> {
		return (
			await this.orm.em.find(
				Promotion,
				{},
				{ orderBy: { number: 'DESC' }, limit: 5, fields: ['*', 'picture', 'users'] },
			)
		).map((p) => p.toObject() as unknown as PromotionResponseDTO);
	}

	@CreateRequestContext()
	async findOne(number: number): Promise<PromotionResponseDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['*', 'picture', 'users'] });
		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		return promotion.toObject() as unknown as PromotionResponseDTO;
	}

	@CreateRequestContext()
	async getUsers(number: number): Promise<BaseUserResponseDTO[]> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['users'] });
		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		const res: BaseUserResponseDTO[] = [];

		for (const user of promotion.users.getItems()) {
			res.push({
				id: user.id,
				updated: user.updated,
				created: user.created,
				first_name: user.first_name,
				last_name: user.last_name,
				nickname: user.nickname,
			});
		}

		return res;
	}

	@CreateRequestContext()
	async updateLogo(number: number, file: Express.Multer.File): Promise<PromotionPictureResponseDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });

		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(env.PROMOTION_BASE_PATH, 'logo'),
			filename: `promotion_${promotion.number}`,
			aspect_ratio: '1:1',
		});

		if (promotion.picture) {
			this.filesService.deleteFromDisk(promotion.picture);

			promotion.picture.filename = fileInfos.filename;
			promotion.picture.mimetype = fileInfos.mimetype;
			promotion.picture.path = fileInfos.filepath;
			promotion.picture.size = fileInfos.size;

			await this.orm.em.persistAndFlush(promotion.picture);
		} else
			promotion.picture = this.orm.em.create(PromotionPicture, {
				filename: fileInfos.filename,
				mimetype: fileInfos.mimetype,
				path: fileInfos.filepath,
				picture_promotion: promotion,
				size: fileInfos.size,
			});

		await this.orm.em.persistAndFlush(promotion);
		return promotion.picture.toObject() as unknown as PromotionPictureResponseDTO;
	}

	@CreateRequestContext()
	async getLogo(number: number): Promise<PromotionPicture> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });
		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		if (!promotion.picture) throw new NotFoundException(this.t.Errors.Promotion.LogoNotFound(number));

		delete promotion.picture.picture_promotion; // avoid circular reference
		return promotion.picture;
	}

	@CreateRequestContext()
	async deleteLogo(number: number): Promise<MessageResponseDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });
		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		if (!promotion.picture) throw new NotFoundException(this.t.Errors.Promotion.LogoNotFound(number));

		this.filesService.deleteFromDisk(promotion.picture);
		await this.orm.em.removeAndFlush(promotion.picture);

		return { message: this.t.Success.Entity.Deleted(PromotionPicture), statusCode: 200 };
	}
}
