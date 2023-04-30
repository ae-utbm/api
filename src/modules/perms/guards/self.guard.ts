import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/users/entities/user.entity';
import { PermissionGuard } from './perms.guard';

@Injectable()
export class PermissionOrSelfGuard extends PermissionGuard implements CanActivate {
	constructor(
		protected readonly reflector: Reflector,
		@Inject(JwtService) protected readonly jwtService: JwtService,
		@Inject(ConfigService) protected readonly configService: ConfigService,
		@Inject(MikroORM) protected readonly orm: MikroORM,
	) {
		super(reflector, jwtService, configService, orm);
	}

	@UseRequestContext()
	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const context = GqlExecutionContext.create(ctx);
		const idParam = this.reflector.get<string>('id_param', context.getHandler());

		// if there is no id_param, then this guard is not needed.
		if (!idParam) return super.canActivate(ctx);

		const token = context.getContext().req.headers.authorization;
		const id = context.getArgs()[idParam];

		// check if the user is trying to access their own data.
		// if not, then this guard is not needed.
		const payload = await this.jwtService.verify(token, { secret: this.configService.get<string>('auth.jwtKey') });
		const user = await this.orm.em.findOne(User, { id: payload.subject });

		return user.id === id || super.canActivate(ctx);
	}
}
