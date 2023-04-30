import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
	imports: [MikroOrmModule.forFeature([User])],
	providers: [UsersResolver, UsersService, JwtService],
	exports: [UsersService],
})
export class UsersModule {}
