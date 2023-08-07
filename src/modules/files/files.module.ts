import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { FileVisibilityGroup } from './entities/file-visibility.entity';

@Module({
	imports: [MikroOrmModule.forFeature([FileVisibilityGroup])],
})
export class FilesModule {}
