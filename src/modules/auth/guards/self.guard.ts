import type { Observable } from 'rxjs';

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { z } from 'zod';

import { i18nBadRequestException } from '@modules/_mixin/http-errors';

import { AuthService } from '../auth.service';

/**
 * Check if the authenticated user is the same as the user ID in the request
 *
 * **The user id parameter should be called `user_id`**
 * @example
 * UseGuards(SelfGuard)
 * async route(@param('user_id', ParseIntPipe) user_id: string) {
 * // ...
 * }
 */
@Injectable()
export class SelfGuard implements CanActivate {
	constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		return SelfGuard.checkSelf(context, this.reflector, this.authService);
	}

	static checkSelf(context: ExecutionContext, reflector: Reflector, authService: AuthService): boolean {
		type req = Omit<Request, 'params' | 'body' | 'headers'> & {
			params: Record<string, string>;
			body: Record<string, string> | Array<Record<string, string>>;
			headers: { authorization: string };
		};

		// Access the request object from the execution context
		const request = context.switchToHttp().getRequest<req>();

		// Access the name of the parameter that contains the user ID
		const id_key = reflector.get<string>('guard_self_param_key', context.getHandler());

		// Ids values find in the data sent with the request, the sender id should be in this list
		const id_key_values: string[] = [];

		/* istanbul ignore next */
		if (request.params[id_key]) id_key_values.push(request.params[id_key]);
		else {
			if (Array.isArray(request.body)) request.body.forEach((data) => id_key_values.push(data[id_key]));
			else id_key_values.push(request.body[id_key]);
		}

		/* istanbul ignore next-line */
		if (!id_key_values.length) return false;

		try {
			z.array(
				z.coerce
					.number()
					.int()
					.min(1)
					.refine((val: unknown) => typeof val === 'number' && Number.isFinite(val)),
			)
				.min(1)
				.parse(id_key_values);
		} catch {
			if (id_key_values.length > 1)
				/* istanbul ignore next-line */
				throw new i18nBadRequestException('validations.ids.invalid.format', {
					property: id_key,
					value: id_key_values.join("', '"),
				});
			else
				throw new i18nBadRequestException('validations.id.invalid.format', {
					property: id_key,
					value: id_key_values[0],
				});
		}

		// Retrieve the authenticated user from the request's user object or session
		const token = request.headers.authorization;

		// Verify and decode the JWT token to extract the user ID
		const payload = authService.verifyJWT(token);

		// Compare the authenticated user's ID with the ID(s) from the request
		return id_key_values.find((id) => payload.sub === parseInt(id, 10)) !== undefined;
	}
}
