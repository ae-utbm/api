import request from 'supertest';

import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { i18nBadRequestException } from '@modules/base/http-errors';
import { OutputTokenDTO } from '@modules/auth/dto/output.dto';

import { server } from '..';

describe('Logs (e2e)', () => {
	let tokenUnauthorized: string;
	let userIdUnauthorized: number;

	let tokenVerified: string;
	let userIdVerified: number;

	let tokenLogModerator: string;
	let userIdLogModerator: number;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: OutputTokenDTO };

		const responseA: res = await request(server).post('/auth/login').send({
			email: 'promos@email.com',
			password: 'root',
		});

		tokenVerified = responseA.body.token;
		userIdVerified = responseA.body.user_id;

		const responseB: res = await request(server).post('/auth/login').send({
			email: 'promos@email.com',
			password: 'root',
		});

		tokenUnauthorized = responseB.body.token;
		userIdUnauthorized = responseB.body.user_id;

		const responseC: res = await request(server).post('/auth/login').send({
			email: 'logs@email.com',
			password: 'root',
		});

		tokenLogModerator = responseC.body.token;
		userIdLogModerator = responseC.body.user_id;
	});

	describe('(GET) /logs/user/:user_id', () => {
		describe('400 : Bad Request', () => {
			it('when the user ID is invalid', async () => {
				const fakeId = 'invalid';

				const response = await request(server)
					.get(`/logs/user/${fakeId}`)
					.set('Authorization', `Bearer ${tokenLogModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: fakeId }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/logs/user/1').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not the same as the user ID in the request', async () => {
				const response = await request(server)
					.get(`/logs/user/${userIdLogModerator}`)
					.set('Authorization', `Bearer ${tokenVerified}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});

			it('when user is asking for another user without the permission', async () => {
				const response = await request(server)
					.get(`/logs/user/${userIdLogModerator}`)
					.set('Authorization', `Bearer ${tokenVerified}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when user is asking for himself', async () => {
				const response = await request(server)
					.get(`/logs/user/${userIdVerified}`)
					.set('Authorization', `Bearer ${tokenVerified}`)
					.expect(200);

				// Expect that all elements in the array have the same type
				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThanOrEqual(0);
				expect(body.isUniform()).toBe(true);
			});

			it('when user is asking for another user with the right permission', async () => {
				const response = await request(server)
					.get(`/logs/user/${userIdUnauthorized}`)
					.set('Authorization', `Bearer ${tokenLogModerator}`)
					.expect(200);

				// Expect that all elements in the array have the same type
				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThan(0);
				expect(body.isUniform()).toBe(true);

				expect(body[0]).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user_id: userIdUnauthorized,
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
		});
	});

	describe('(DELETE) /logs/:user_id', () => {
		describe('400 : Bad Request', () => {
			it('when the user ID is invalid', async () => {
				const fakeId = 'invalid';

				const response = await request(server)
					.delete(`/logs/user/${fakeId}`)
					.set('Authorization', `Bearer ${tokenLogModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: fakeId }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/logs/user/1').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.get(`/logs/user/${userIdLogModerator}`)
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is authorized', async () => {
				const response = await request(server)
					.delete(`/logs/user/${userIdLogModerator}`)
					.set('Authorization', `Bearer ${tokenLogModerator}`)
					.expect(200);

				expect(response.body).toEqual({
					...new OutputMessageDTO('validations.logs.success.deleted'),
				});
			});
		});
	});
});
