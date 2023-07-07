import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Log } from './entities/log.entity';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { UsersService } from '@modules/users/users.service';
import { JwtService } from '@nestjs/jwt';

@Module({
	imports: [MikroOrmModule.forFeature([Log])],
	providers: [LogsService, UsersService, JwtService],
	controllers: [LogsController],
	exports: [LogsService],
})
export class LogsModule {}
