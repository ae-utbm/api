import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '@modules/users/users.service';

import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
	imports: [MikroOrmModule.forFeature([Permission])],
	providers: [PermissionsService, JwtService, UsersService],
	controllers: [PermissionsController],
	exports: [PermissionsService],
})
export class PermissionsModule {}
