import request from 'supertest';

import { Errors, Success } from '@i18n';
import { TokenDTO } from '@modules/auth/dto/token.dto';
import { Log } from '@modules/logs/entities/log.entity';
import { User } from '@modules/users/entities/user.entity';

import { app, i18n } from '..';

describe('Logs (e2e)', () => {
	let tokenUnverified: string;
	let userIdUnverified: number;

	let tokenUnauthorized: string;
	let userIdUnauthorized: number;

	let tokenLogModerator: string;
	let userIdLogModerator: number;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: TokenDTO };

		const responseA: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'unverified@email.com',
			password: 'root',
		});

		tokenUnverified = responseA.body.token;
		userIdUnverified = responseA.body.user_id;

		const responseB: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = responseB.body.token;
		userIdUnauthorized = responseB.body.user_id;

		const responseC: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'logs@email.com',
			password: 'root',
		});

		tokenLogModerator = responseC.body.token;
		userIdLogModerator = responseC.body.user_id;
	});

	describe('/logs/user/{user_id} (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/logs/user/1').expect(401);

			expect(response.body).toEqual({
				// TODO: add an error message ('Unauthorized') and translate the message field (add more context too)
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not the same as the user ID in the request', async () => {
			const response = await request(app.getHttpServer())
				.get(`/logs/user/${userIdUnverified}`)
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
				.get(`/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(404);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: Errors.Generic.IdNotFound({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 400 when the user ID is invalid', async () => {
			const fakeId = 'invalid';

			const response = await request(app.getHttpServer())
				.get(`/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: Errors.Generic.IdInvalid({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 401 when user is not verified', async () => {
			const response = await request(app.getHttpServer())
				.get(`/logs/user/${userIdUnverified}`)
				.set('Authorization', `Bearer ${tokenUnverified}`)
				.expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: Errors.Email.NotVerified({ i18n, type: User }),
				error: 'Unauthorized',
			});
		});

		it('should return 200 when user is asking for himself', async () => {
			const response = await request(app.getHttpServer())
				.get(`/logs/user/${userIdUnauthorized}`)
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
				.get(`/logs/user/${userIdUnauthorized}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(200);

			// Expect that all elements in the array have the same type
			const body = response.body as Array<unknown>;

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeGreaterThan(0);
			expect(body.haveEqualObjects()).toBe(true);

			expect(body[0]).toEqual({
				id: expect.any(Number),
				created_at: expect.any(String),
				updated_at: expect.any(String),
				user: userIdUnauthorized,
				action: expect.any(String),
				ip: expect.any(String),
				user_agent: expect.any(String),
				route: expect.any(String),
				method: expect.any(String),
				body: expect.any(String),
				query: expect.any(String),
				params: expect.any(String),
				response: null,
				status_code: expect.any(Number),
				error: null,
				error_stack: null,
				error_message: null,
			});
		});

		it('should return 403 when user is asking for another user without the permission', async () => {
			const response = await request(app.getHttpServer())
				.get(`/logs/user/${userIdLogModerator}`)
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});
	});

	describe('/logs/{user} (DELETE)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/logs/user/1').expect(401);

			expect(response.body).toEqual({
				// TODO: add an error message ('Unauthorized') and translate the message field (add more context too)
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get(`/logs/user/${userIdUnverified}`)
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
				.delete(`/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: Errors.Generic.IdInvalid({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 200 when the user is authorized', async () => {
			const response = await request(app.getHttpServer())
				.delete(`/logs/user/${userIdLogModerator}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(200);

			expect(response.body).toEqual({
				statusCode: 200,
				message: Success.Generic.Deleted({ i18n, type: Log }),
			});
		});
	});
});
