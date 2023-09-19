import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { TranslateService } from '@modules/translate/translate.service';

import { FileVisibilityGroup } from './entities/file-visibility.entity';
import { FilesService } from './files.service';
import { ImagesService } from './images.service';

@Module({
	imports: [MikroOrmModule.forFeature([FileVisibilityGroup])],
	providers: [FilesService, TranslateService, ImagesService],
	exports: [FilesService],
})
export class FilesModule {}
