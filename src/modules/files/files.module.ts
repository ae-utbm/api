import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { EmailsService } from '@modules/emails/emails.service';
import { TranslateService } from '@modules/translate/translate.service';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { FileVisibilityGroup } from './entities/file-visibility.entity';
import { FilesService } from './files.service';
import { ImagesService } from './images.service';

@Module({
	imports: [MikroOrmModule.forFeature([FileVisibilityGroup])],
	providers: [EmailsService, FilesService, TranslateService, ImagesService, UsersDataService],
	exports: [FilesService],
})
export class FilesModule {}
