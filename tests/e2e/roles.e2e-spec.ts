import request from 'supertest';

import { app } from '..';

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
				created_at: expect.any(String) as string,
				expires: expect.any(String) as string,
				id: 1,
				name: expect.any(String) as string,
				permissions: expect.any(Array) as Array<string>,
				revoked: false,
				updated_at: expect.any(String) as string,
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
	});
});
