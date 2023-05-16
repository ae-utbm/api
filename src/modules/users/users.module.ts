import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UserVisibility } from './entities/user-visibility.entity';
import { UsersController } from './users.controller';

@Module({
	imports: [MikroOrmModule.forFeature([User, UserVisibility])],
	providers: [UsersResolver, UsersService, JwtService],
	controllers: [UsersController],
	exports: [UsersService],
})
export class UsersModule {}
