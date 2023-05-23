import type { PermissionName } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { User } from '@modules/users/entities/user.entity';

export abstract class PermsGuardMixin implements CanActivate {
	public constructor(
		protected readonly orm: MikroORM,
		protected readonly reflector: Reflector,
		protected readonly jwtService: JwtService,
		protected readonly configService: ConfigService,
	) {}

	abstract context(ctx: ExecutionContext): GqlExecutionContext | ExecutionContext;

	@UseRequestContext()
	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const context = this.context(ctx);
		const permsToValidate = this.reflector.get<Array<PermissionName>>('permissions', context.getHandler());

		if (!permsToValidate) return true;

		const token =
			context instanceof GqlExecutionContext
				? context.getContext().req.headers.authorization
				: context.switchToHttp().getRequest().headers.authorization;

		const payload = await this.jwtService.verify(token, { secret: this.configService.get<string>('auth.jwtKey') });
		const user = await this.orm.em.findOne(User, { id: payload.subject });
		if (!user) return false;

		const perms = (await user.permissions.loadItems())
			.filter((p) => p.expires > new Date() && p.revoked === false)
			.map((p) => p.name);

		const rolesPerms = (await user.roles.loadItems())
			.filter((p) => p.expires > new Date() && p.revoked === false)
			.map((p) => p.permissions)
			.flat();

		const acquiredPerms = [...perms, ...rolesPerms];

		// If the user has the ROOT permission, they have all permissions.
		if (acquiredPerms.includes('ROOT')) return true;

		// If the user has any of the required permissions, they have permission.
		if (acquiredPerms.some((p) => permsToValidate.includes(p))) return true;

		// Otherwise, they don't have permission.
		return false;
	}
}

/**
 * Guard used to check if the user has the required permissions
 * to access a route, based on the permissions attached to the route
 *
 * Usage:
 * - `@UseGuards(PermissionGuard)` on top of a route/resolver
 * - `@Permissions('PERM1', 'PERM2')` on top of the route/resolver
 *
 * @see [PERMISSIONS](../../perms/perms.ts) for the list of permissions
 * @see [Self](../decorators/self.decorator.ts)
 * @see [Permissions](../decorators/perms.decorator.ts)
 */
@Injectable()
export class PermissionGuard extends PermsGuardMixin {
	constructor(
		@Inject(MikroORM) override readonly orm: MikroORM,
		@Inject(Reflector) override readonly reflector: Reflector,
		@Inject(JwtService) override readonly jwtService: JwtService,
		@Inject(ConfigService) override readonly configService: ConfigService,
	) {
		super(orm, reflector, jwtService, configService);
	}

	override context(ctx: ExecutionContext): GqlExecutionContext {
		return GqlExecutionContext.create(ctx);
	}
}

@Injectable()
export class PermissionGuardREST extends PermsGuardMixin {
	constructor(
		@Inject(MikroORM) override readonly orm: MikroORM,
		@Inject(Reflector) override readonly reflector: Reflector,
		@Inject(JwtService) override readonly jwtService: JwtService,
		@Inject(ConfigService) override readonly configService: ConfigService,
	) {
		super(orm, reflector, jwtService, configService);
	}

	override context(ctx: ExecutionContext): ExecutionContext {
		return ctx;
	}
}
