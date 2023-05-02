import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';
import { JwtService } from '@nestjs/jwt';

@Module({
	imports: [MikroOrmModule.forFeature([Role])],
	providers: [RolesResolver, RolesService, JwtService],
	exports: [RolesService],
})
export class RolesModule {}
