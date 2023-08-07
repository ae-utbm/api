import type { I18nTranslations } from '@types';

import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { convertToWebp, getFileExtension, hasAspectRatio } from '@utils/images';

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
			throw new NotFoundException(Errors.Generic.IdNotFound({ type: Promotion, id: number, i18n: this.i18n }));

		let { buffer, mimetype } = file;
		if (!mimetype.startsWith('image/'))
			throw new BadRequestException(Errors.Image.InvalidMimeType({ i18n: this.i18n }));

		const imageDir = join(this.configService.get<string>('files.promotions'), 'logo');

		// Check if the file respect the aspect ratio
		if (!(await hasAspectRatio(buffer, '1:1')))
			throw new BadRequestException(Errors.Image.InvalidAspectRatio({ i18n: this.i18n, aspect_ratio: '1:1' }));

		// Convert the file to webp (unless it's a GIF or webp already)
		buffer = await convertToWebp(buffer);

		// Get the extension and update the mimetype
		const extension = await getFileExtension(buffer);
		mimetype = `image/${extension}`;

		// Generate the filename and the path
		const filename = `promotion_${promotion.number}_${randomUUID()}.${extension}`;
		const filepath = join(imageDir, filename);

		// Write the file on disk
		mkdirSync(imageDir, { recursive: true });
		writeFileSync(filepath, buffer);

		// Update the database
		if (promotion.picture) {
			await promotion.picture.init();

			// Remove the old file
			rmSync(promotion.picture.path);

			// Set the new values
			promotion.picture.filename = filename;
			promotion.picture.mimetype = 'image/webp';
			promotion.picture.updated_at = new Date();
			promotion.picture.size = buffer.byteLength;
			promotion.picture.path = filepath;

			await this.orm.em.persistAndFlush(promotion.picture);
		} else
			promotion.picture = this.orm.em.create(PromotionPicture, {
				filename,
				mimetype,
				path: filepath,
				promotion,
				size: buffer.byteLength,
				description: 'Promotion logo',
				visibility: null,
			});

		await this.orm.em.persistAndFlush(promotion);

		// Fix issue with the picture not being populated
		// -> happens when the picture is updated
		const out = await this.orm.em.findOne(Promotion, { number }, { fields: ['*'], populate: ['picture'] });
		delete out.picture.promotion; // avoid circular reference
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
		rmSync(promotion.picture.path);
		await this.orm.em.remove(promotion.picture).flush();

		return promotion;
	}
}
