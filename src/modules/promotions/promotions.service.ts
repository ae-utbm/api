import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Promotion } from './entities/promotion.entity';
import { UsersService } from 'src/modules/users/users.service';
import { ConfigService } from '@nestjs/config';

import fs from 'fs';
import { join } from 'path';
import { convertToWebp, isSquare } from 'src/utils/images';
import { PromotionPicture } from './entities/promotion-picture.entity';
import { PromotionResponseDTO } from './dto/promotion.dto';
import { PromotionUsersResponseDTO } from './dto/promotion-users.dto';

@Injectable()
export class PromotionsService {
	constructor(
		private readonly orm: MikroORM,
		private readonly usersService: UsersService,
		private readonly configService: ConfigService,
	) {}

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
	async getUsers(number: number): Promise<PromotionUsersResponseDTO[]> {
		const promotion = await this.orm.em.findOne(Promotion, { number }, { fields: ['users'] });
		if (!promotion) throw new NotFoundException(`Promotion with number ${number} not found`);

		const res: PromotionUsersResponseDTO[] = [];

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
