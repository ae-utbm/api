import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from '@modules/auth/auth.service';
import { UsersModule } from '@modules/users/users.module';

import { Log } from './entities/log.entity';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
	imports: [MikroOrmModule.forFeature([Log]), UsersModule],
	providers: [LogsService, JwtService, AuthService],
	controllers: [LogsController],
	exports: [LogsService],
})
export class LogsModule {}
