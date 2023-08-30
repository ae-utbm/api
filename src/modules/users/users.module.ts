import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EmailsService } from '@modules/emails/emails.service';
import { FilesService } from '@modules/files/files.service';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';

import { UsersDataController } from './controllers/users-data.controller';
import { UsersFilesController } from './controllers/users-files.controller';
import { UsersService } from './users.service';

@Module({
	imports: [MikroOrmModule.forFeature([User, UserVisibility])],
	providers: [UsersService, JwtService, FilesService, EmailsService],
	controllers: [UsersDataController, UsersFilesController],
	exports: [UsersService],
})
export class UsersModule {}
