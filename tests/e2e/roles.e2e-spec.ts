import request from 'supertest';

import { Errors } from '@i18n';
import { RolePostDTO } from '@modules/roles/dto/post.dto';

import { app, i18n } from '..';

describe('Roles', () => {
	let tokenUnauthorized: string;
	let tokenRolesModerator: string;

	beforeAll(async () => {
		type Res = Omit<request.Response, 'body'> & { body: { token: string } };

		const resA: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'roles@email.com',
			password: 'root',
		});

		tokenRolesModerator = resB.body.token;
	});

	describe('/api/roles (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/roles').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/roles')
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 200 when the user is authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/roles')
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

	describe('/api/roles (POST)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).post('/api/roles').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/roles')
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 400 when the body is invalid', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/roles')
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

		it('should return 400 when one of the permissions is invalid', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/roles')
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

		it('should return 400 when a role with the same name already exists', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/roles')
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

		it('should return 201 when the role is created', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/roles')
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
