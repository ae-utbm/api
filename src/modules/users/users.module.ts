import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '@modules/auth/auth.service';
import { EmailsService } from '@modules/emails/emails.service';
import { FilesService } from '@modules/files/files.service';
import { ImagesService } from '@modules/files/images.service';
import { TranslateService } from '@modules/translate/translate.service';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';

import { UsersDataController } from './controllers/users-data.controller';
import { UsersFilesController } from './controllers/users-files.controller';
import { UsersDataService } from './services/users-data.service';
import { UsersFilesService } from './services/users-files.service';

@Module({
	imports: [MikroOrmModule.forFeature([User, UserVisibility])],
	providers: [
		AuthService,
		EmailsService,
		FilesService,
		ImagesService,
		JwtService,
		TranslateService,
		UsersDataService,
		UsersFilesService,
	],
	controllers: [UsersDataController, UsersFilesController],
	exports: [UsersDataService, UsersFilesService],
})
export class UsersModule {}
