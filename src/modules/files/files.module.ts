import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { FileVisibilityGroup } from './entities/file-visibility.entity';
import { FilesService } from './files.service';

@Module({
	imports: [MikroOrmModule.forFeature([FileVisibilityGroup])],
	providers: [FilesService],
	exports: [FilesService],
})
export class FilesModule {}
