import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '@modules/auth/auth.service';
import { EmailsService } from '@modules/emails/emails.service';
import { FilesService } from '@modules/files/files.service';
import { ImagesService } from '@modules/files/images.service';
import { TranslateService } from '@modules/translate/translate.service';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
	imports: [MikroOrmModule.forFeature([Promotion, PromotionPicture])],
	providers: [
		PromotionsService,
		JwtService,
		UsersDataService,
		FilesService,
		EmailsService,
		AuthService,
		TranslateService,
		ImagesService,
	],
	controllers: [PromotionsController],
	exports: [PromotionsService],
})
export class PromotionsModule {}
