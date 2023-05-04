import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Promotion } from './entities/promotion.entity';
import { PromotionObject } from './models/promotion.object';
import { UserGroupedObject } from '@modules/users/models/user-grouped.object';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class PromotionsService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async findAll(): Promise<PromotionObject[]> {
		return this.orm.em.find(Promotion, {});
	}

	@UseRequestContext()
	async findUsersInPromotion(number: number): Promise<UserGroupedObject[]> {
		return this.orm.em.findOneOrFail(Promotion, { number }, { fields: ['users'] }).then((promotion: Promotion) =>
			promotion.users.getItems().map((user) => {
				const u = new UserGroupedObject();
				u.id = user.id;
				u.first_name = user.first_name;
				u.last_name = user.last_name;
				u.nickname = user.nickname;
				u.promotion = user.promotion;

				return u;
			}),
		);
	}
}
