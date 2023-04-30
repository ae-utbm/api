import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Permission } from './entities/permission.entity';
import { PermissionsResolver } from './perms.resolver';
import { PermissionsService } from './perms.service';
import { JwtService } from '@nestjs/jwt';

@Module({
	imports: [MikroOrmModule.forFeature([Permission])],
	providers: [PermissionsResolver, PermissionsService, JwtService],
	exports: [PermissionsService],
})
export class PermissionsModule {}
