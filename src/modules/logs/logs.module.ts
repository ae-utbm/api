import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Log } from './entities/log.entity';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { UsersService } from '@modules/users/users.service';

@Module({
	imports: [MikroOrmModule.forFeature([Log])],
	providers: [LogsService, UsersService],
	controllers: [LogsController],
	exports: [LogsService],
})
export class LogsModule {}
