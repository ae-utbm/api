import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '@modules/users/users.service';

import { Role } from './entities/role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
	imports: [MikroOrmModule.forFeature([Role])],
	providers: [RolesService, JwtService, UsersService],
	controllers: [RolesController],
	exports: [RolesService],
})
export class RolesModule {}
