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
		return this.orm.em.find(Promotion, {});
	}

	@UseRequestContext()
	async findUsersInPromotion(number: number) {
		const promotion = await this.orm.em.findOneOrFail(Promotion, { number }, { fields: ['users'] });
		const users = promotion.users.getItems().map((user) => this.usersService.convertToUserGrouped(user));

		return users;
	}
}
