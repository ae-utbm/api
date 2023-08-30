import type { I18nTranslations, PERMISSION_NAMES } from '@types';
import type { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';

import { UsersService } from '@modules/users/users.service';

import { AuthService } from '../auth.service';

/**
 * Check if the authenticated user has the required permissions to access the route
 * @example
 * UseGuards(PermissionGuard)
 * ApiPermissions('permission1', 'permission2')
 * async route() {
 * // ...
 * }
 */
@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		protected readonly jwtService: JwtService,
		protected readonly configService: ConfigService,
		protected readonly userService: UsersService,
		protected readonly i18nService: I18nService<I18nTranslations>,
		protected readonly reflector: Reflector,
		protected readonly authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext) {
		type req = Request & { headers: { authorization: string } };

		// Access the request object from the execution context
		const request = context.switchToHttp().getRequest<req>();

		// Access the permissions required to access the route
		const permsToValidate = this.reflector.get<Array<PERMISSION_NAMES>>('guard_permissions', context.getHandler());

		// Retrieve the authenticated user from the request's user object or session
		const bearerToken = request.headers.authorization;

		// Verify and decode the JWT token to extract the user ID
		const decodedToken = this.authService.verifyJWT(bearerToken);

		// Get the user from the database
		// If no user found -> thrown within the service
		const user = await this.userService.findOne({ id: decodedToken.sub });

		const perms = (await user.permissions.loadItems())
			.filter((p) => p.expires > new Date() && p.revoked === false)
			.map((p) => p.name);

		const rolesPerms = (await user.roles.loadItems())
			.filter((p) => p.expires > new Date() && p.revoked === false)
			.map((p) => p.permissions)
			.flat();

		const acquiredPerms = [...perms, ...rolesPerms];

		// If the user has the ROOT permission, they have all permissions.
		// If the user has any of the required permissions, they have permission.
		if (acquiredPerms.includes('ROOT') || acquiredPerms.some((p) => permsToValidate.includes(p))) return true;

		// Otherwise, they don't have permission.
		return false;
	}
}
