import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Promotion } from './entities/promotion.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ConfigService } from '@nestjs/config';

import fs from 'fs';
import { join } from 'path';
import { convertToWebp, isSquare } from 'src/utils/images';
import { PromotionPicture } from './entities/promotion-picture.entity';

@Injectable()
export class PromotionsService {
	constructor(
		private readonly orm: MikroORM,
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
	) {}

	@UseRequestContext()
	async findAll(): Promise<Promotion[]> {
		return await this.orm.em.find(Promotion, {});
	}

	@UseRequestContext()
	async findLatest(): Promise<Promotion> {
		return (await this.orm.em.find(Promotion, {}, { orderBy: { number: 'DESC' } }))[0];
	}

	@UseRequestContext()
	async findOne(number: number): Promise<Promotion> {
		return await this.orm.em.findOneOrFail(Promotion, { number });
	}

	@UseRequestContext()
	async getUsers(number: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { number }, { fields: ['users'] });
		const users = promotion.users.getItems().map((user) => this.usersService.checkVisibility(user));

		return users;
	}

	@UseRequestContext()
	async updateLogo({ id, file }: { id: number; file: Express.Multer.File }) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { id });
		if (promotion.picture) await promotion.picture.init();

		const { buffer, mimetype } = file;
		const imageDir = join(this.configService.get<string>('files.promotions'), 'logo');
		const extension = mimetype.replace('image/', '.');
		const filename = `${promotion.number}${extension}`;
		const imagePath = join(imageDir, filename);

		// write the file
		fs.mkdirSync(imageDir, { recursive: true });
		fs.writeFileSync(imagePath, buffer);

		if (!isSquare(imagePath)) {
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
			promotion.picture.mimetype = mimetype;
			promotion.picture.updated_at = new Date();
			promotion.picture.size = buffer.byteLength;
			promotion.picture.path = imagePath.replace(extension, '.webp');
		}

		await this.orm.em.persistAndFlush(promotion);
	}

	@UseRequestContext()
	async getLogo(id: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { id });
		if (!promotion.picture) throw new HttpException('This promotion has no logo', HttpStatus.NOT_FOUND);

		await promotion.picture.init();
		return promotion.picture;
	}

	@UseRequestContext()
	async deleteLogo(id: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { id });
		if (!promotion.picture) throw new HttpException('This promotion has no logo', HttpStatus.NOT_FOUND);

		await promotion.picture.init();
		fs.unlinkSync(promotion.picture.path);
		await this.orm.em.remove(promotion.picture).flush();
	}
}
