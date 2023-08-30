import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '@modules/auth/auth.service';
import { EmailsService } from '@modules/emails/emails.service';
import { FilesService } from '@modules/files/files.service';
import { UsersService } from '@modules/users/users.service';

import { PromotionPicture } from './entities/promotion-picture.entity';
import { Promotion } from './entities/promotion.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
	imports: [MikroOrmModule.forFeature([Promotion, PromotionPicture])],
	providers: [PromotionsService, JwtService, UsersService, FilesService, EmailsService, AuthService],
	controllers: [PromotionsController],
	exports: [PromotionsService],
})
export class PromotionsModule {}
