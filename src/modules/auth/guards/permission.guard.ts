import type { PERMISSION_NAMES } from '#types/api';
import type { Request } from 'express';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { UsersDataService } from '@modules/users/services/users-data.service';

import { AuthService } from '../auth.service';

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		protected readonly jwtService: JwtService,
		protected readonly userService: UsersDataService,
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
		return this.userService.hasPermissionOrRoleWithPermission(user.id, false, perms_to_validate);
	}
}
