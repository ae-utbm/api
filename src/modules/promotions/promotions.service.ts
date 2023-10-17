import { join } from 'path';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';

import { PromotionResponseDTO } from './dto/promotion.dto';
import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { BaseUserResponseDTO } from '../users/dto/base-user.dto';

@Injectable()
export class PromotionsService {
	constructor(
		private readonly t: TranslateService,
		private readonly orm: MikroORM,
		private readonly configService: ConfigService,
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
		const promotions = await this.orm.em.find(Promotion, {}, { fields: ['*', 'picture', 'users'] });
		const res: PromotionResponseDTO[] = [];

		for (const promotion of promotions) {
			res.push({ ...promotion, users: promotion.users.count() });
		}

		return res;
	}

	@CreateRequestContext()
	async findLatest(): Promise<PromotionResponseDTO> {
		const promotion = (
			await this.orm.em.find(Promotion, {}, { orderBy: { number: 'DESC' }, fields: ['*', 'picture', 'users'] })
		)[0];

		return {
			...promotion,
			users: promotion.users.count(),
		};
	}

	@CreateRequestContext()
	async findCurrent(): Promise<PromotionResponseDTO[]> {
		const promotions = await this.orm.em.find(
			Promotion,
			{},
			{ orderBy: { number: 'DESC' }, fields: ['*', 'picture', 'users'], limit: 5 },
		);
		const res: PromotionResponseDTO[] = [];

		for (const promotion of promotions) {
			res.push({ ...promotion, users: promotion.users.count() });
		}

		return res;
	}

	@CreateRequestContext()
	async findOne(number: number): Promise<PromotionResponseDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['*', 'picture', 'users'] });
		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		return {
			...promotion,
			users: promotion.users.count(),
		};
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
	async updateLogo(number: number, file: Express.Multer.File): Promise<Promotion> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });

		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(this.configService.get<string>('files.promotions'), 'logo'),
			filename: `promotion_${promotion.number}`,
			aspectRatio: '1:1',
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

		// Fix issue with the picture not being populated
		// -> happens when the picture is updated
		const out = await this.orm.em.findOne(Promotion, { number }, { fields: ['*'], populate: ['picture'] });
		delete out.picture.picture_promotion; // avoid circular reference
		return out;
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
	async deleteLogo(number: number): Promise<Promotion> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { populate: ['picture'] });
		if (!promotion) throw new NotFoundException(this.t.Errors.Id.NotFound(Promotion, number));

		if (!promotion.picture) throw new NotFoundException(this.t.Errors.Promotion.LogoNotFound(number));

		this.filesService.deleteFromDisk(promotion.picture);
		await this.orm.em.removeAndFlush(promotion.picture);

		return promotion;
	}
}
