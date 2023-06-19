import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Promotion } from './entities/promotion.entity';
import { PromotionsService } from './promotions.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';
import { PromotionsController } from './promotions.controller';

@Module({
	imports: [MikroOrmModule.forFeature([Promotion])],
	providers: [PromotionsService, JwtService, UsersService],
	controllers: [PromotionsController],
	exports: [PromotionsService],
})
export class PromotionsModule {}
