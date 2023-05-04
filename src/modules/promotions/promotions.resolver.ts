import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { PromotionsService } from './promotions.service';
import { Promotion } from './entities/promotion.entity';
import { PromotionObject } from './models/promotion.object';
import { UserGroupedObject } from '@modules/users/models/user-grouped.object';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from '@modules/auth/guards/perms.guard';
import { Permissions } from '@modules/auth/decorators/perms.decorator';

@Resolver(() => Promotion)
export class PromotionsResolver {
	constructor(private readonly promotionsService: PromotionsService) {}

	@Query(() => [PromotionObject])
	async promotions(): Promise<PromotionObject[]> {
		return this.promotionsService.findAll();
	}

	@Query(() => [UserGroupedObject])
	@UseGuards(PermissionGuard)
	@Permissions('CAN_VIEW_USERS_IN_PROMOTION')
	async usersInPromotion(@Args('number', { type: () => Int }) number: number): Promise<UserGroupedObject[]> {
		return this.promotionsService.findUsersInPromotion(number);
	}
}
