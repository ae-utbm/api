import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { User } from '@modules/users/entities/user.entity';
import { PermissionGuard } from './perms.guard';

/**
 * Guard used to check if the user has the required permissions or if they are themselves the target user
 * to access a route, based on the permissions attached to the route
 *
 * Usage:
 * - `@UseGuards(PermissionOrSelfGuard)` on top of a route/resolver
 * - `@Permissions('PERM1', 'PERM2')` on top of the route/resolver
 * - `@Self('id')` on top of the route/resolver, where `id` is the name of the parameter containing the id of the target user
 *
 * @see [PERMISSIONS](../../perms/perms.ts) for the list of permissions
 * @see [Self](../decorators/self.decorator.ts)
 * @see [Permissions](../decorators/perms.decorator.ts)
 */
@Injectable()
export class PermissionOrSelfGuard extends PermissionGuard implements CanActivate {
	constructor(
		protected override readonly reflector: Reflector,
		@Inject(JwtService) protected override readonly jwtService: JwtService,
		@Inject(ConfigService) protected override readonly configService: ConfigService,
		@Inject(MikroORM) protected override readonly orm: MikroORM,
	) {
		super(reflector, jwtService, configService, orm);
	}

	@UseRequestContext()
	override async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const context = GqlExecutionContext.create(ctx);
		const idParam = this.reflector.get<string>('id_param', context.getHandler());

		// if there is no id_param, then we should refer to permission guard
		if (!idParam) return super.canActivate(ctx);

		const token = context.getContext().req.headers.authorization;
		let id: number = undefined;

		// allow dot notation to access nested objects
		if (idParam.includes('.')) {
			const keys = idParam.split('.');
			let value = context.getArgs();

			for (const key of keys) {
				if (value && typeof value === 'object' && key in value) value = value[key];
			}

			id = value;
		}
		// direct access to the object
		else id = context.getArgs()[idParam];

		// check if the user is trying to access their own data.
		// if not, then this guard is not needed and we should refer to permission guard
		const payload = await this.jwtService.verify(token, { secret: this.configService.get<string>('auth.jwtKey') });
		const user = await this.orm.em.findOne(User, { id: payload.subject });
		if (!user) return super.canActivate(ctx);

		return user.id === id || super.canActivate(ctx);
	}
}
