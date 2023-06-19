import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';
import { JwtService } from '@nestjs/jwt';
import { RolesController } from './roles.controller';
import { UsersService } from '@modules/users/users.service';

@Module({
	imports: [MikroOrmModule.forFeature([Role])],
	providers: [RolesService, JwtService, UsersService],
	controllers: [RolesController],
	exports: [RolesService],
})
export class RolesModule {}
