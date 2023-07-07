import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '@modules/users/users.service';

import { Log } from './entities/log.entity';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
	imports: [MikroOrmModule.forFeature([Log])],
	providers: [LogsService, UsersService, JwtService],
	controllers: [LogsController],
	exports: [LogsService],
})
export class LogsModule {}
