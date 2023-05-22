import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Promotion } from './entities/promotion.entity';
import { PromotionsResolver } from './promotions.resolver';
import { PromotionsService } from './promotions.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@modules/users/users.service';
import { PromotionsController } from './promotions.controller';

@Module({
	imports: [MikroOrmModule.forFeature([Promotion])],
	providers: [PromotionsResolver, PromotionsService, JwtService, UsersService],
	controllers: [PromotionsController],
	exports: [PromotionsService],
})
export class PromotionsModule {}
