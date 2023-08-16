import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersModule } from '@modules/users/users.module';

import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
	imports: [MikroOrmModule.forFeature([Permission]), UsersModule],
	providers: [PermissionsService, JwtService],
	controllers: [PermissionsController],
	exports: [PermissionsService],
})
export class PermissionsModule {}
