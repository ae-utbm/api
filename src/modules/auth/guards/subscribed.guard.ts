import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { UsersDataService } from '@modules/users/services/users-data.service';

import { AuthService } from '../auth.service';

@Injectable()
export class SubscribedGuard implements CanActivate {
	constructor(
		protected readonly jwtService: JwtService,
		protected readonly configService: ConfigService,
		protected readonly userService: UsersDataService,
		protected readonly reflector: Reflector,
		protected readonly authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext) {
		return SubscribedGuard.checkSubscribed(context, this.authService, this.userService);
	}

	static async checkSubscribed(context: ExecutionContext, authService: AuthService, userService: UsersDataService) {
		type req = Request & { headers: { authorization: string } };

		const request = context.switchToHttp().getRequest<req>();

		// Retrieve the authenticated user from the request's user object or session
		const bearer_token = request.headers.authorization;

		// Verify and decode the JWT token to extract the user ID
		const payload = authService.verifyJWT(bearer_token);

		// Get the user from the database
		// If no user found -> thrown within the service
		const user = await userService.findOne(payload.sub, false);

		// TODO: (KEY: 2) Make a PR to implement subscriptions in the API
		return user.subscribed;
	}
}
