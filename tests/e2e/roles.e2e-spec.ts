import request from 'supertest';

import { Errors } from '@i18n';
import { RolePostDTO } from '@modules/roles/dto/post.dto';

import { app, i18n } from '..';

describe('Roles (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenRolesModerator: string;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: { token: string } };

		const resA: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'roles@email.com',
			password: 'root',
		});

		tokenRolesModerator = resB.body.token;
	});

	describe('(GET) /roles', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/roles').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles')
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
				const response = await request(app.getHttpServer())
					.get('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				// Expect that all elements in the array have the same type
				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThan(0);
				expect(body.haveEqualObjects()).toBe(true);

				expect(body[0]).toEqual({
					created_at: expect.any(String),
					expires: expect.any(String),
					id: expect.any(Number),
					name: expect.any(String),
					permissions: expect.any(Array),
					revoked: false,
					updated_at: expect.any(String),
				});
			});
		});
	});

	describe('(POST) /roles', () => {
		describe('400 : Bad Request', () => {
			it('when the body is invalid', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'test',
						permissions: ['test'],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: Errors.Generic.FieldMissing({ field: 'expires', type: RolePostDTO, i18n }),
					error: 'Bad Request',
				});
			});

			it('when one of the permissions is invalid', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'test',
						permissions: ['test'],
						expires: '2021-01-01',
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: Errors.Permission.Invalid({ i18n, permission: 'test' }),
					error: 'Bad Request',
				});
			});

			it('when a role with the same name already exists', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'PERMISSIONS_MODERATOR',
						permissions: ['ROOT'],
						expires: '2021-01-01',
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: Errors.Role.NameAlreadyUsed({ i18n, name: 'PERMISSIONS_MODERATOR' }),
					error: 'Bad Request',
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).post('/roles').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});
		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('201 : Created', () => {
			it('when the role is created', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'test_role',
						permissions: ['ROOT'],
						expires: '2999-01-01',
					})
					.expect(201);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created_at: expect.any(String),
					updated_at: expect.any(String),
					name: 'TEST_ROLE',
					revoked: false,
					expires: '2999-01-01T00:00:00.000Z',
					permissions: ['ROOT'],
				});
			});
		});
	});

	describe('(PATCH) /roles', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).patch('/roles').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('400 : Bad Request', () => {
			it('when the body is invalid', async () => {
				const response = await request(app.getHttpServer())
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'test',
						permissions: ['test'],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: Errors.Generic.FieldMissing({ field: 'id', type: RolePostDTO, i18n }),
					error: 'Bad Request',
				});
			});
		});
	});
});
