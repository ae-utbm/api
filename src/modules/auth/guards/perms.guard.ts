import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/users/entities/user.entity';
import { PermissionName } from '../decorators/perms.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		protected readonly reflector: Reflector,
		@Inject(JwtService) protected readonly jwtService: JwtService,
		@Inject(ConfigService) protected readonly configService: ConfigService,
		@Inject(MikroORM) protected readonly orm: MikroORM,
	) {}

	@UseRequestContext()
	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const context = GqlExecutionContext.create(ctx);
		const permsToValidate = this.reflector.get<Array<PermissionName>>('permissions', context.getHandler());
		if (!permsToValidate) return true;

		const token = context.getContext().req.headers.authorization;
		const payload = await this.jwtService.verify(token, { secret: this.configService.get<string>('auth.jwtKey') });
		const user = await this.orm.em.findOne(User, { id: payload.subject });
		if (!user) return false;

		const perms = (await user.permissions.loadItems())
			.filter((p) => p.expires > new Date() && p.revoked === false)
			.map((p) => p.name);

		const roles = (await user.roles.loadItems())
			.filter((p) => p.expires > new Date() && p.revoked === false)
			.map((p) => p.permissions)
			.flat();

		const acquiredPerms = [...perms, ...roles];

		// If the user has the ROOT permission, they have all permissions.
		if (acquiredPerms.includes('ROOT')) return true;

		// If the user has any of the required permissions, they have permission.
		if (acquiredPerms.some((p) => permsToValidate.includes(p))) return true;

		// Otherwise, they don't have permission.
		return false;
	}
}
