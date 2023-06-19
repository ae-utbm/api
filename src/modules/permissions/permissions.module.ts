import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Permission } from './entities/permission.entity';
import { JwtService } from '@nestjs/jwt';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { UsersService } from '@modules/users/users.service';

@Module({
	imports: [MikroOrmModule.forFeature([Permission])],
	providers: [PermissionsService, JwtService, UsersService],
	controllers: [PermissionsController],
	exports: [PermissionsService],
})
export class PermissionsModule {}
