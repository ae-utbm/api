import type { PERMISSION_NAMES } from '#types/api';
import type { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

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
		protected readonly reflector: Reflector,
		protected readonly authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext) {
		type req = Request & { headers: { authorization: string } };

		// Access the request object from the execution context
		const request = context.switchToHttp().getRequest<req>();

		// Access the permissions required to access the route
		const perms_to_validate = this.reflector.get<Array<PERMISSION_NAMES>>('guard_permissions', context.getHandler());

		// Retrieve the authenticated user from the request's user object or session
		const bearer_token = request.headers.authorization;

		// Verify and decode the JWT token to extract the user ID
		const payload = this.authService.verifyJWT(bearer_token);

		// Get the user from the database
		// If no user found -> thrown within the service
		const user = await this.userService.findOne(payload.sub, false);

		const user_perms = await this.userService.getUserPermissions(user.id, { show_expired: false, show_revoked: false });
		const perms = user_perms.map((p) => p.name);

		const user_roles = await this.userService.getUserRoles(user.id, { show_expired: false, show_revoked: false });
		const roles = user_roles
			.filter((r) => r.expires > new Date() && r.revoked === false)
			.map((r) => r.permissions)
			.flat();

		const acquired_perms = [...perms, ...roles];

		// If the user has the ROOT permission, they have all permissions.
		// If the user has any of the required permissions, they have permission.
		if (acquired_perms.includes('ROOT') || acquired_perms.some((p) => perms_to_validate.includes(p))) return true;

		// Otherwise, they don't have permission.
		return false;
	}
}
