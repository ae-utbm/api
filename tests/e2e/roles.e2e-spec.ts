import request from 'supertest';

import { RolePostDTO } from '@modules/roles/dto/post.dto';
import { Role } from '@modules/roles/entities/role.entity';
import { User } from '@modules/users/entities/user.entity';

import { app, t, orm } from '..';

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
					users: expect.any(Number),
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
					message: t.Errors.Field.Missing(RolePostDTO, 'expires'),
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
					message: t.Errors.Permission.Invalid('test'),
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
					message: t.Errors.Role.NameAlreadyUsed('PERMISSIONS_MODERATOR'),
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
					message: t.Errors.Field.Missing(RolePostDTO, 'id'),
					error: 'Bad Request',
				});
			});
		});

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

		describe('404 : Not Found', () => {
			it('when the role does not exist', async () => {
				const response = await request(app.getHttpServer())
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						id: 9999,
						name: 'test',
						permissions: ['test'],
					})
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(Role, 9999),
					error: 'Not Found',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role is updated', async () => {
				const role_id = (await orm.em.findOne(Role, { name: 'TEST_ROLE' })).id;
				const response = await request(app.getHttpServer())
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						id: role_id,
						name: 'test_test_role',
						permissions: ['ROOT', 'CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
						expires: new Date('2998-01-01'),
					})
					.expect(200);

				expect(response.body).toEqual({
					id: role_id,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					name: 'TEST_TEST_ROLE',
					revoked: false,
					expires: '2998-01-01T00:00:00.000Z',
					permissions: ['ROOT', 'CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
					users: 0,
				});
			});
		});
	});

	describe('(GET) /roles/:roles_id', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/invalid')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Number, 'id'),
					error: 'Bad Request',
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/roles/1').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/1')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the role id does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/9999')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(Role, 9999),
					error: 'Not Found',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/1')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				expect(response.body).toEqual({
					id: 1,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					name: 'PERMISSIONS_MODERATOR',
					revoked: false,
					expires: '9999-12-31T00:00:00.000Z',
					permissions: [
						'CAN_READ_PERMISSIONS_OF_USER',
						'CAN_EDIT_PERMISSIONS_OF_USER',
						'CAN_READ_PERMISSIONS_OF_ROLE',
						'CAN_EDIT_PERMISSIONS_OF_ROLE',
					],
					users: 1,
				});
			});
		});
	});

	describe('(GET) /roles/:roles_id/users', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/invalid/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Number, 'id'),
					error: 'Bad Request',
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/roles/1/users').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/1/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the role does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/9999/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(Role, 9999),
					error: 'Not Found',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				expect(response.body).toEqual([
					{
						id: 5,
						nickname: null,
						first_name: 'perms',
						last_name: 'moderator',
						created_at: expect.any(String),
						updated_at: expect.any(String),
					},
				]);
			});
		});
	});

	describe('(POST) /roles/:roles_id/users', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles/invalid/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [1, 2, 3],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Number, 'role_id'),
					error: 'Bad Request',
				});
			});

			it('when the user id is invalid', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: ['invalid'],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Number, 'user_id'),
					error: 'Bad Request',
				});
			});

			it('when no user ids are given', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Array, 'users'),
					error: 'Bad Request',
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).post('/roles/1/users').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the role does not exist', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles/9999/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [1, 2, 3],
					})
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(Role, 9999),
					error: 'Not Found',
				});
			});

			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [9999],
					})
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(User, 9999),
					error: 'Not Found',
				});
			});
		});

		describe('201 : Created', () => {
			it('should add the users to the role', async () => {
				const role_id = (await orm.em.findOne(Role, { name: 'TEST_TEST_ROLE' })).id;
				const response = await request(app.getHttpServer())
					.post(`/roles/${role_id}/users`)
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [1, 2, 5],
					})
					.expect(201);

				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThan(0);
				expect(body.haveEqualObjects()).toBe(true);

				expect(body[0]).toEqual({
					id: 1,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					nickname: 'noot noot',
				});

				expect(body[1]).toEqual({
					id: 2,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					first_name: 'unverified',
					last_name: 'user',
					nickname: null,
				});

				expect(body[2]).toEqual({
					id: 5,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					first_name: 'perms',
					last_name: 'moderator',
					nickname: null,
				});
			});
		});
	});

	describe('(DELETE) /roles/:roles_id/users', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(app.getHttpServer())
					.delete('/roles/invalid/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [1, 2, 3],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Number, 'role_id'),
					error: 'Bad Request',
				});
			});

			it('when the user id is invalid', async () => {
				const response = await request(app.getHttpServer())
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: ['invalid'],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Number, 'user_id'),
					error: 'Bad Request',
				});
			});

			it('when no user ids are given', async () => {
				const response = await request(app.getHttpServer())
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [],
					})
					.expect(400);

				expect(response.body).toEqual({
					statusCode: 400,
					message: t.Errors.Field.Invalid(Array, 'users'),
					error: 'Bad Request',
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).delete('/roles/1/users').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the role does not exist', async () => {
				const response = await request(app.getHttpServer())
					.delete('/roles/9999/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [1, 2, 3],
					})
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(Role, 9999),
					error: 'Not Found',
				});
			});

			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [9999],
					})
					.expect(404);

				expect(response.body).toEqual({
					statusCode: 404,
					message: t.Errors.Id.NotFound(User, 9999),
					error: 'Not Found',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role exist and the users are removed', async () => {
				const role_id = (await orm.em.findOne(Role, { name: 'TEST_TEST_ROLE' })).id;
				const response = await request(app.getHttpServer())
					.delete(`/roles/${role_id}/users`)
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [2],
					})
					.expect(200);

				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toEqual(2);
				expect(body.haveEqualObjects()).toBe(true);

				expect(body[0]).toEqual({
					id: 1,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					nickname: 'noot noot',
				});

				expect(body[1]).toEqual({
					id: 5,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					first_name: 'perms',
					last_name: 'moderator',
					nickname: null,
				});
			});
		});
	});
});
