import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Promotion } from './entities/promotion.entity';
import { PromotionObject } from './models/promotion.object';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class PromotionsService {
	constructor(private readonly orm: MikroORM, private readonly usersService: UsersService) {}

	@UseRequestContext()
	async findAll(): Promise<PromotionObject[]> {
		const promotions = await this.orm.em.find(Promotion, {});
		return promotions.map((promotion) => ({ ...promotion, picture: promotion.picture?.path }));
	}

	@UseRequestContext()
	async findOne(number: number): Promise<PromotionObject> {
		return await this.orm.em.findOneOrFail(Promotion, { number });
	}

	@UseRequestContext()
	async findUsersInPromotion(number: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { number }, { fields: ['users'] });
		const users = promotion.users.getItems().map((user) => this.usersService.checkVisibility(user));

		return users;
	}
}
