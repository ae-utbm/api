import type { I18nTranslations } from '@types';

import { join } from 'path';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { FilesService } from '@modules/files/files.service';

import { PromotionResponseDTO } from './dto/promotion.dto';
import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { BaseUserResponseDTO } from '../users/dto/base-user.dto';

@Injectable()
export class PromotionsService {
	constructor(
		private readonly orm: MikroORM,
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly configService: ConfigService,
		private readonly filesService: FilesService,
	) {}

	/**
	 * Create a new promotion each year on the 15th of July
	 */
	@Cron('0 0 0 15 7 *')
	@UseRequestContext()
	async createNewPromotion(): Promise<void> {
		const latest = await this.findLatest();
		const newPromotion = this.orm.em.create(Promotion, { number: latest.number + 1 });

		await this.orm.em.persistAndFlush(newPromotion);
	}

	@UseRequestContext()
	async findAll(): Promise<PromotionResponseDTO[]> {
		const promotions = await this.orm.em.find(Promotion, {}, { fields: ['*', 'picture', 'users'] });
		const res: PromotionResponseDTO[] = [];

		for (const promotion of promotions) {
			res.push({ ...promotion, users: promotion.users.count() });
		}

		return res;
	}

	@UseRequestContext()
	async findLatest(): Promise<PromotionResponseDTO> {
		const promotion = (
			await this.orm.em.find(Promotion, {}, { orderBy: { number: 'DESC' }, fields: ['*', 'picture', 'users'] })
		)[0];

		return {
			...promotion,
			users: promotion.users.count(),
		};
	}

	@UseRequestContext()
	async findOne(number: number): Promise<PromotionResponseDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['*', 'picture', 'users'] });
		if (!promotion)
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: Promotion, id: number, i18n: this.i18n }));

		return {
			...promotion,
			users: promotion.users.count(),
		};
	}

	@UseRequestContext()
	async getUsers(number: number): Promise<BaseUserResponseDTO[]> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['users'] });
		if (!promotion)
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: Promotion, id: number, i18n: this.i18n }));

		const res: BaseUserResponseDTO[] = [];

		for (const user of promotion.users.getItems()) {
			res.push({
				id: user.id,
				updated_at: user.updated_at,
				created_at: user.created_at,
				first_name: user.first_name,
				last_name: user.last_name,
				nickname: user.nickname,
			});
		}

		return res;
	}

	@UseRequestContext()
	async updateLogo(number: number, file: Express.Multer.File): Promise<Promotion> {
		const promotion = await this.orm.em.findOne(Promotion, { number });

		if (!promotion)
			throw new NotFoundException(Errors.Generic.IdNotFound({ i18n: this.i18n, id: number, type: Promotion }));

		const fileInfos = await this.filesService.writeOnDiskAsImage(file, {
			directory: join(this.configService.get<string>('files.promotions'), 'logo'),
			filename: `promotion_${number}`,
			aspectRatio: '1:1',
		});

		if (promotion.picture) {
			await promotion.picture.init();
			this.filesService.deleteOnDisk(promotion.picture);

			promotion.picture.filename = fileInfos.filename;
			promotion.picture.mimetype = `image/${fileInfos.extension}`;
			promotion.picture.path = fileInfos.filepath;
			promotion.picture.size = fileInfos.size;

			await this.orm.em.persistAndFlush(promotion.picture);
		} else
			promotion.picture = this.orm.em.create(PromotionPicture, {
				filename: fileInfos.filename,
				mimetype: `image/${fileInfos.extension}`,
				description: `Promotion logo of the promotion ${promotion.number}`,
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

	@UseRequestContext()
	async getLogo(number: number) {
		const promotion = await this.orm.em.findOne(Promotion, { number });
		if (!promotion)
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: Promotion, id: number, i18n: this.i18n }));

		if (!promotion.picture) throw new NotFoundException(Errors.Promotion.LogoNotFound({ i18n: this.i18n, number }));

		await promotion.picture.init();
		return promotion.picture;
	}

	@UseRequestContext()
	async deleteLogo(number: number): Promise<Promotion> {
		const promotion = await this.orm.em.findOne(Promotion, { number });
		if (!promotion)
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: Promotion, id: number, i18n: this.i18n }));

		if (!promotion.picture) throw new NotFoundException(Errors.Promotion.LogoNotFound({ i18n: this.i18n, number }));

		await promotion.picture.init();
		this.filesService.deleteOnDisk(promotion.picture);
		await this.orm.em.removeAndFlush(promotion.picture);

		return promotion;
	}
}
