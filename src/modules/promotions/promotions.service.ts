import fs from 'fs';
import { join } from 'path';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { convertToWebp, isSquare } from '@utils/images';

import { PromotionResponseDTO } from './dto/promotion.dto';
import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { BaseUserResponseDTO } from '../users/dto/base-user.dto';

@Injectable()
export class PromotionsService {
	constructor(private readonly orm: MikroORM, private readonly configService: ConfigService) {}

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
		if (!promotion) throw new NotFoundException(`Promotion with number ${number} not found`);

		return {
			...promotion,
			users: promotion.users.count() ?? 0,
		};
	}

	@UseRequestContext()
	async getUsers(number: number): Promise<BaseUserResponseDTO[]> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['users'] });
		if (!promotion) throw new NotFoundException(`Promotion with number ${number} not found`);

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
	async updateLogo({ number, file }: { number: number; file: Express.Multer.File }) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { number });
		if (promotion.picture) await promotion.picture.init();

		const { buffer, mimetype } = file;
		const imageDir = join(this.configService.get<string>('files.promotions'), 'logo');
		const extension = mimetype.replace('image/', '.');
		const filename = `${promotion.number}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		if (!(await isSquare(imagePath))) {
			fs.unlinkSync(imagePath);
			throw new HttpException('The logo must be square', HttpStatus.BAD_REQUEST);
		}

		// remove the old picture (if any)
		if (promotion.picture && promotion.picture.path && promotion.picture.path !== imagePath)
			fs.unlinkSync(promotion.picture.path);

		// convert to webp
		fs.createWriteStream(await convertToWebp(imagePath));

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
	}

	@UseRequestContext()
	async getLogo(number: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { number });
		if (!promotion.picture) throw new HttpException('This promotion has no logo', HttpStatus.NOT_FOUND);

		await promotion.picture.init();
		return promotion.picture;
	}

	@UseRequestContext()
	async deleteLogo(number: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { number });
		if (!promotion.picture) throw new HttpException('This promotion has no logo', HttpStatus.NOT_FOUND);

		await promotion.picture.init();
		fs.unlinkSync(promotion.picture.path);
		await this.orm.em.remove(promotion.picture).flush();
	}
}
