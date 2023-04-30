import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { User } from 'src/modules/users/entities/user.entity';
import { TPermission } from '../decorators/perms.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		@Inject(JwtService) private jwtService: JwtService,
		@Inject(ConfigService) private configService: ConfigService,
		@Inject(MikroORM) private readonly orm: MikroORM,
	) {}

	canActivate(ctx: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const context = GqlExecutionContext.create(ctx);
		const perms = this.reflector.get<Array<TPermission>>('permissions', context.getHandler());
		if (!perms) return true;

		const token = context.getContext().req.headers.authorization;
		return this.validateRequest(token, perms);
	}

	@UseRequestContext()
	async validateRequest(token: string, required: Array<TPermission>): Promise<boolean> {
		const payload = await this.jwtService.verify(token, { secret: this.configService.get<string>('auth.jwtKey') });

		const user = await this.orm.em.findOne(User, { id: payload.subject });
		const perms = (await user.permissions.loadItems()).filter((p) => p.expires > new Date() && p.revoked === false);

		// If the user has the ROOT permission, they have all permissions.
		if (perms.map((p) => p.name).includes('ROOT') && perms.map((p) => p.expires < new Date())) return true;

		// If the user has any of the required permissions, they have permission.
		if (perms.map((p) => p.name).some((p) => required.includes(p))) return true;

		// Otherwise, they don't have permission.
		return false;
	}
}
