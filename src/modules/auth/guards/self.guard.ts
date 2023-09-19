import type { Observable } from 'rxjs';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthService } from '../auth.service';

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
	constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		return checkSelf(context, this.reflector, this.authService);
	}
}

export function checkSelf(context: ExecutionContext, reflector: Reflector, authService: AuthService): boolean {
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
	/* istanbul ignore next-line */
	if (!user_id) throw new Error(`The parameter ${userIdKey} is missing from the request.`);

	// Retrieve the authenticated user from the request's user object or session
	const bearerToken = request.headers.authorization;

	// Verify and decode the JWT token to extract the user ID
	const decodedToken = authService.verifyJWT(bearerToken);

	// Compare the authenticated user's ID with the ID from the request
	return decodedToken.sub === parseInt(user_id, 10);
}
