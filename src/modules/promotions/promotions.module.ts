import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { FilesService } from '@modules/files/files.service';
import { UsersService } from '@modules/users/users.service';

import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
	imports: [MikroOrmModule.forFeature([Promotion, PromotionPicture])],
	providers: [PromotionsService, JwtService, UsersService, FilesService],
	controllers: [PromotionsController],
	exports: [PromotionsService],
})
export class PromotionsModule {}
