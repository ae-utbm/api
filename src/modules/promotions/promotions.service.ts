import { join } from 'path';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { env } from '@env';
import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { i18nNotFoundException } from '@modules/base/http-errors';
import { ImagesService } from '@modules/files/images.service';

import { OutputPromotionPictureDTO, OutputPromotionDTO } from './dto/output.dto';
import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { OutputBaseUserDTO } from '../users/dto/output.dto';

@Injectable()
export class PromotionsService {
	constructor(private readonly orm: MikroORM, private readonly imagesService: ImagesService) {}

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
	async findAll(): Promise<OutputPromotionDTO[]> {
		return (await this.orm.em.find(Promotion, {}, { fields: ['*', 'users'] })).map(
			(p) => p.toObject() as unknown as OutputPromotionDTO,
		);
	}

	@CreateRequestContext()
	async findLatest(): Promise<OutputPromotionDTO> {
		const promotion = (
			await this.orm.em.find(
				Promotion,
				{},
				{ orderBy: { number: 'DESC' }, limit: 1, fields: ['*', 'picture', 'users'] },
			)
		)[0];
		return promotion.toObject() as unknown as OutputPromotionDTO;
	}

	@CreateRequestContext()
	async findCurrent(): Promise<OutputPromotionDTO[]> {
		return (
			await this.orm.em.find(
				Promotion,
				{},
				{ orderBy: { number: 'DESC' }, limit: 5, fields: ['*', 'picture', 'users'] },
			)
		).map((p) => p.toObject() as unknown as OutputPromotionDTO);
	}

	@CreateRequestContext()
	async findOne(number: number): Promise<OutputPromotionDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['*', 'picture', 'users'] });
		if (!promotion) throw new i18nNotFoundException('validations.promotion.invalid.not_found', { number });

		return promotion.toObject() as unknown as OutputPromotionDTO;
	}

	@CreateRequestContext()
	async getUsers(number: number): Promise<OutputBaseUserDTO[]> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['users'] });
		if (!promotion) throw new i18nNotFoundException('validations.promotion.invalid.not_found', { number });

		const res: OutputBaseUserDTO[] = [];

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
	async updateLogo(number: number, file: Express.Multer.File): Promise<OutputPromotionPictureDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });

		if (!promotion) throw new i18nNotFoundException('validations.promotion.invalid.not_found', { number });

		const fileInfos = await this.imagesService.writeOnDisk(file.buffer, {
			directory: join(env.PROMOTION_BASE_PATH, 'logo'),
			filename: `promotion_${promotion.number}`,
			aspect_ratio: '1:1',
		});

		if (promotion.picture) {
			this.imagesService.deleteFromDisk(promotion.picture);

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
		return promotion.picture.toObject() as unknown as OutputPromotionPictureDTO;
	}

	@CreateRequestContext()
	async getLogo(number: number): Promise<PromotionPicture> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });
		if (!promotion) throw new i18nNotFoundException('validations.promotion.invalid.not_found', { number });

		if (!promotion.picture) throw new i18nNotFoundException('validations.promotion.invalid.no_logo', { number });

		delete promotion.picture.picture_promotion; // avoid circular reference
		return promotion.picture;
	}

	@CreateRequestContext()
	async deleteLogo(number: number): Promise<OutputMessageDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });
		if (!promotion) throw new i18nNotFoundException('validations.promotion.invalid.not_found', { number });

		if (!promotion.picture) throw new i18nNotFoundException('validations.promotion.invalid.no_logo', { number });

		this.imagesService.deleteFromDisk(promotion.picture);
		await this.orm.em.removeAndFlush(promotion.picture);

		return new OutputMessageDTO('validations.promotion.success.deleted_logo', { number: promotion.number });
	}
}
