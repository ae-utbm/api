import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersModule } from '@modules/users/users.module';

import { Role } from './entities/role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
	imports: [MikroOrmModule.forFeature([Role]), UsersModule],
	providers: [RolesService, JwtService],
	controllers: [RolesController],
	exports: [RolesService],
})
export class RolesModule {}
