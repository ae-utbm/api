import type { IncomingMessage, ServerResponse } from 'http';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { tap, type Observable } from 'rxjs';

import { User } from '@modules/users/entities/user.entity';

import { Log } from '../entities/log.entity';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
		type req = IncomingMessage & {
			route: { path: string };
			user: User;
			params: Record<string, string>;
			query: Record<string, string>;
			body: Record<string, string>;
			ip: string;
		};

		const request = context.switchToHttp().getRequest<req>();
		const user_id = request.user ? request.user.id : 'Guest';

		// No need to log guest users
		if (user_id === 'Guest') return next.handle();

		// Create a separate entity manager for this request
		// > to avoid conflicts with the main entity manager (in the request scope)
		const em = this.orm.em.fork();

		// Create a new log entry
		const user = await em.findOne(User, { id: user_id });
		const log = em.create(Log, {
			user,
			action: context.getClass().name + '.' + context.getHandler().name,
			ip: request.ip.replace('::1', '127.0.0.1'),
			user_agent: request.headers['user-agent'] ?? 'Unknown',
			route: request.route.path,
			method: request.method,
			body: request.body as unknown as string,
			query: request.query as unknown as string,
			params: request.params as unknown as string,
			updated_at: undefined,
		});

		return next.handle().pipe(
			tap({
				// eslint-disable-next-line @typescript-eslint/no-misused-promises
				finalize: async () => {
					type res = ServerResponse & {
						body: Record<string, string>;
						error: string;
						error_stack: string;
						error_message: string;
					};
					const response = context.switchToHttp().getResponse<res>();

					// Update the log entity after the observable is ended
					log.response = response.body as unknown as string; // TODO: Get the actual response body (actually null)
					log.status_code = response.statusCode;
					log.error = response.error;
					log.error_stack = response.error_stack;
					log.error_message = response.error_message;
					log.updated_at = new Date();

					user.last_seen = new Date();
					await em.flush();
				},
			}),
		);
	}
}
