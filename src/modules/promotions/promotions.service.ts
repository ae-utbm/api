import type { I18nTranslations } from '@types';

import { mkdirSync, writeFileSync, createWriteStream, rmSync } from 'fs';
import { join } from 'path';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { convertToWebp, isSquare } from '@utils/images';
import { idNotFound, imageInvalidAspectRatio, imageInvalidMimeType, promotionLogoNotFound } from '@utils/responses';

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
			res.push({ ...promotion, users: promotion.users.count() ?? 0 });
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
			users: promotion.users.count() ?? 0,
		};
	}

	@UseRequestContext()
	async findOne(number: number): Promise<PromotionResponseDTO> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['*', 'picture', 'users'] });
		if (!promotion) throw new NotFoundException(idNotFound({ type: Promotion, id: number, i18n: this.i18n }));

		return {
			...promotion,
			users: promotion.users.count() ?? 0,
		};
	}

	@UseRequestContext()
	async getUsers(number: number): Promise<BaseUserResponseDTO[]> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['users'] });
		if (!promotion) throw new NotFoundException(idNotFound({ type: Promotion, id: number, i18n: this.i18n }));

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
		if (!promotion) throw new NotFoundException(idNotFound({ type: Promotion, id: number, i18n: this.i18n }));
		if (promotion.picture) await promotion.picture.init();

		const { buffer, mimetype } = file;
		if (!mimetype.startsWith('image/')) throw new BadRequestException(imageInvalidMimeType({ i18n: this.i18n }));

		const imageDir = join(this.configService.get<string>('files.promotions'), 'logo');
		const extension = mimetype.replace('image/', '.');
		const filename = `${promotion.number}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		mkdirSync(imageDir, { recursive: true });
		writeFileSync(imagePath, buffer);

		if (!(await isSquare(imagePath))) {
			rmSync(imagePath);
			throw new BadRequestException(imageInvalidAspectRatio({ i18n: this.i18n, aspect_ratio: '1:1' }));
		}

		// remove the old picture (if any)
		if (promotion.picture && promotion.picture.path && promotion.picture.path !== imagePath) {
			rmSync(promotion.picture.path);
		}

		// convert to webp if not already (or GIF)
		const convertedPath = await convertToWebp(imagePath);
		if (convertedPath !== imagePath) createWriteStream(convertedPath).close();

		// update the database
		if (!promotion.picture)
			promotion.picture = this.orm.em.create(PromotionPicture, {
				filename,
				mimetype,
				path: imagePath.replace(extension, '.webp'),
				promotion,
				size: buffer.byteLength,
				visibility: 'public',
			});
		else {
			promotion.picture.filename = filename;
			promotion.picture.mimetype = 'image/webp';
			promotion.picture.updated_at = new Date();
			promotion.picture.size = buffer.byteLength;
			promotion.picture.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(promotion);

		delete promotion.picture.promotion;
		return promotion;
	}

	@UseRequestContext()
	async getLogo(number: number) {
		const promotion = await this.orm.em.findOne(Promotion, { number });
		if (!promotion) throw new NotFoundException(idNotFound({ type: Promotion, id: number, i18n: this.i18n }));
		if (!promotion.picture) throw new NotFoundException(promotionLogoNotFound({ i18n: this.i18n, number }));

		await promotion.picture.init();
		return promotion.picture;
	}

	@UseRequestContext()
	async deleteLogo(number: number): Promise<Promotion> {
		const promotion = await this.orm.em.findOne(Promotion, { number });
		if (!promotion) throw new NotFoundException(idNotFound({ type: Promotion, id: number, i18n: this.i18n }));
		if (!promotion.picture) throw new NotFoundException(promotionLogoNotFound({ i18n: this.i18n, number }));

		await promotion.picture.init();
		rmSync(promotion.picture.path);
		await this.orm.em.remove(promotion.picture).flush();

		return promotion;
	}
}
