import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { PromotionsService } from './promotions.service';
import { PromotionObject } from './models/promotion.object';
import { UseGuards } from '@nestjs/common';
import { PermissionGuard } from '@modules/auth/guards/perms.guard';
import { Permissions } from '@modules/auth/decorators/perms.decorator';
import { UserObject } from '@modules/users/models/user.object';

@Resolver(() => PromotionObject)
export class PromotionsResolver {
	constructor(private readonly promotionsService: PromotionsService) {}

	@Query(() => [PromotionObject])
	async promotions(): Promise<PromotionObject[]> {
		return this.promotionsService.findAll();
	}

	@Query(() => PromotionObject)
	async promotion(@Args('number', { type: () => Int }) number: number): Promise<PromotionObject> {
		return this.promotionsService.findOne(number);
	}

	@Query(() => PromotionObject)
	async latestPromotion(): Promise<PromotionObject> {
		return this.promotionsService.findLatest();
	}

	@Query(() => [UserObject])
	@UseGuards(PermissionGuard)
	@Permissions('CAN_VIEW_USERS_IN_PROMOTION')
	async usersInPromotion(@Args('number', { type: () => Int }) number: number) {
		return this.promotionsService.findUsersInPromotion(number);
	}
}
