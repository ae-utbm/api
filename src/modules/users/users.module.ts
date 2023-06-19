import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtService } from '@nestjs/jwt';

import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { UsersController } from './users.controller';
import { User } from '@modules/users/entities/user.entity';

@Module({
	imports: [MikroOrmModule.forFeature([User, UserVisibility])],
	providers: [UsersService, JwtService],
	controllers: [UsersController],
	exports: [UsersService],
})
export class UsersModule {}
