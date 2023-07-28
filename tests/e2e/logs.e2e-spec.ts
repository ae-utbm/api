import request from 'supertest';

import { TokenDTO } from '@modules/auth/dto/token.dto';
import { Log } from '@modules/logs/entities/log.entity';
import { User } from '@modules/users/entities/user.entity';
import { deleteSuccess, emailNotVerified, idInvalid, idNotFound } from '@utils/responses';

import { app, i18n } from '..';

describe('Logs (e2e)', () => {
	let tokenUnverified: string;
	let userIdUnverified: number;

	let tokenUnauthorized: string;
	let userIdUnauthorized: number;

	let tokenLogModerator: string;
	let userIdLogModerator: number;

	beforeAll(async () => {
		type Res = Omit<request.Response, 'body'> & { body: TokenDTO };

		const responseA: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'unverified@email.com',
			password: 'root',
		});

		tokenUnverified = responseA.body.token;
		userIdUnverified = responseA.body.user_id;

		const responseB: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = responseB.body.token;
		userIdUnauthorized = responseB.body.user_id;

		const responseC: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'logs@email.com',
			password: 'root',
		});

		tokenLogModerator = responseC.body.token;
		userIdLogModerator = responseC.body.user_id;
	});

	describe('/api/logs/user/{user_id} (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/logs/user/1').expect(401);

			expect(response.body).toEqual({
				// TODO: add an error message ('Unauthorized') and translate the message field (add more context too)
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not the same as the user ID in the request', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${userIdUnverified}`)
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the user does not exist', async () => {
			const fakeId = 9999;

			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(404);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 400 when the user ID is invalid', async () => {
			const fakeId = 'invalid';

			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: idInvalid({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 401 when user is not verified', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${userIdUnverified}`)
				.set('Authorization', `Bearer ${tokenUnverified}`)
				.expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: emailNotVerified({ i18n, type: User }),
				error: 'Unauthorized',
			});
		});

		it('should return 200 when user is asking for himself', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${userIdUnauthorized}`)
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(200);

			// Expect that all elements in the array have the same type
			const body = response.body as Array<unknown>;

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeGreaterThanOrEqual(0);
			expect(body.haveEqualObjects()).toBe(true);
		});

		it('should return 200 when user is asking for another user with the right permission', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${userIdUnauthorized}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(200);

			// Expect that all elements in the array have the same type
			const body = response.body as Array<unknown>;

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeGreaterThan(0);
			expect(body.haveEqualObjects()).toBe(true);

			expect(body[0]).toEqual({
				id: expect.any(Number) as number,
				created_at: expect.any(String) as string,
				updated_at: expect.any(String) as string,
				user: userIdUnauthorized,
				action: expect.any(String) as string,
				ip: expect.any(String) as string,
				user_agent: expect.any(String) as string,
				route: expect.any(String) as string,
				method: expect.any(String) as string,
				body: expect.any(String) as string,
				query: expect.any(String) as string,
				params: expect.any(String) as string,
				response: null,
				status_code: expect.any(Number) as number,
				error: null,
				error_stack: null,
				error_message: null,
			});
		});

		it('should return 403 when user is asking for another user without the permission', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${userIdLogModerator}`)
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});
	});

	describe('/api/logs/{user} (DELETE)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/logs/user/1').expect(401);

			expect(response.body).toEqual({
				// TODO: add an error message ('Unauthorized') and translate the message field (add more context too)
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${userIdUnverified}`)
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 400 when the user ID is invalid', async () => {
			const fakeId = 'invalid';

			const response = await request(app.getHttpServer())
				.delete(`/api/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: idInvalid({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 200 when the user is authorized', async () => {
			const response = await request(app.getHttpServer())
				.delete(`/api/logs/user/${userIdLogModerator}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(200);

			expect(response.body).toEqual({
				statusCode: 200,
				message: deleteSuccess({ i18n, type: Log }),
			});
		});
	});
});
