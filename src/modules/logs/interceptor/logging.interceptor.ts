import { tap, type Observable } from 'rxjs';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Log } from '../entities/log.entity';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
		const request = context.switchToHttp().getRequest();
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
			ip: context.switchToHttp().getRequest().ip,
			user_agent: context.switchToHttp().getRequest().headers['user-agent'],
			route: context.switchToHttp().getRequest().route.path,
			method: context.switchToHttp().getRequest().method,
			body: context.switchToHttp().getRequest().body,
			query: context.switchToHttp().getRequest().query,
			params: context.switchToHttp().getRequest().params,
			updated_at: undefined,
		});

		return next.handle().pipe(
			tap({
				finalize: async () => {
					// Update the log entity after the observable is ended
					log.response = context.switchToHttp().getResponse().body;
					log.status_code = context.switchToHttp().getResponse().statusCode;
					log.error = context.switchToHttp().getResponse().error;
					log.error_stack = context.switchToHttp().getResponse().error_stack;
					log.error_message = context.switchToHttp().getResponse().error_message;
					log.updated_at = new Date();

					await em.flush();
				},
			}),
		);
	}
}
