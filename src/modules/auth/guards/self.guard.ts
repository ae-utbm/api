import type { I18nTranslations } from '@types';
import type { Observable } from 'rxjs';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { Request } from 'supertest';

import { verifyJWT } from '@utils/jwt';

/**
 * Check if the authenticated user is the same as the user ID in the request
 *
 * **The user id parameter should be called `user_id`**
 * @example
 * UseGuards(SelfGuard)
 * async route(@param('user_id') user_id: string) {
 * // ...
 * }
 */
@Injectable()
export class SelfGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly i18nService: I18nService<I18nTranslations>,
		private readonly reflector: Reflector,
	) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		return checkSelf(context, this.jwtService, this.configService, this.i18nService, this.reflector);
	}
}

export function checkSelf(
	context: ExecutionContext,
	jwtService: JwtService,
	configService: ConfigService,
	i18nService: I18nService<I18nTranslations>,
	reflector: Reflector,
): boolean {
	type req = Request & {
		params: { [key: string]: string };
		body: { [key: string]: string };
		headers: { authorization: string };
	};

	// Access the request object from the execution context
	const request = context.switchToHttp().getRequest<req>();

	// Access the name of the parameter that contains the user ID
	const userIdKey = reflector.get<string>('guard_self_param_key', context.getHandler());

	// Extract the user ID from the request parameters or body
	const user_id = request.params[userIdKey] ?? request.body[userIdKey];
	if (!user_id) throw new Error(`The parameter ${userIdKey} is missing from the request.`);

	// Retrieve the authenticated user from the request's user object or session
	const bearerToken = request.headers.authorization;

	// Verify and decode the JWT token to extract the user ID
	const decodedToken = verifyJWT({ token: bearerToken, jwtService, configService, i18nService });

	// Compare the authenticated user's ID with the ID from the request
	return decodedToken.sub === parseInt(user_id, 10);
}
