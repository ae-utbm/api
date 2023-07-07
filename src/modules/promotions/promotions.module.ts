import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '@modules/users/users.service';

import { Promotion } from './entities/promotion.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
	imports: [MikroOrmModule.forFeature([Promotion])],
	providers: [PromotionsService, JwtService, UsersService],
	controllers: [PromotionsController],
	exports: [PromotionsService],
})
export class PromotionsModule {}
