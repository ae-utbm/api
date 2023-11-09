import request from 'supertest';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { i18nBadRequestException, i18nNotFoundException } from '@modules/base/http-errors';
import { InputUpdateRoleUserDTO } from '@modules/roles/dto/input.dto';
import { Role } from '@modules/roles/entities/role.entity';

import { server, orm } from '..';

describe('Roles (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenRolesModerator: string;
	let em: typeof orm.em;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: { token: string } };
		em = orm.em.fork();

		const resA: res = await request(server).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: res = await request(server).post('/auth/login').send({
			email: 'roles@email.com',
			password: 'root',
		});

		tokenRolesModerator = resB.body.token;
	});

	describe('(GET) /roles', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/roles').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				// Expect that all elements in the array have the same type
				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThan(0);
				expect(body.isUniform()).toBe(true);

				expect(body[0]).toEqual({
					created: expect.any(String),
					id: expect.any(Number),
					name: expect.any(String),
					permissions: expect.any(Array),
					revoked: false,
					updated: expect.any(String),
					users_count: expect.any(Number),
				});
			});
		});
	});

	describe('(POST) /roles', () => {
		describe('400 : Bad Request', () => {
			it('when the body is invalid', async () => {
				const response = await request(server)
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						permissions: ['test'],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException([
						{ key: 'validations.string.invalid.uppercase', args: { property: 'name', value: undefined } },
						{ key: 'validations.string.invalid.format', args: { property: 'name', value: undefined } },
						{
							key: 'validations.permission.invalid.format',
							args: { property: 'permissions', value: 'test', permissions: PERMISSIONS_NAMES.join("', '") },
						},
					]),
				});
			});

			it('when one of the permissions is invalid', async () => {
				const response = await request(server)
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'TEST',
						permissions: ['TEST'],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.permission.invalid.format', {
						property: 'permissions',
						value: 'TEST',
						permissions: PERMISSIONS_NAMES.join("', '"),
					}),
				});
			});

			it('when a role with the same name already exists', async () => {
				const response = await request(server)
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'PERMISSIONS_MODERATOR',
						permissions: ['ROOT'],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.role.invalid.already_exist', { name: 'PERMISSIONS_MODERATOR' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).post('/roles').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.post('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'TEST_ROLE',
						permissions: ['ROOT'],
					})
					.expect(201);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					name: 'TEST_ROLE',
					revoked: false,
					permissions: ['ROOT'],
					users_count: 0,
				});
			});
		});
	});

	describe('(PATCH) /roles', () => {
		describe('400 : Bad Request', () => {
			it('when the body is invalid', async () => {
				const response = await request(server)
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						name: 'test',
						permissions: ['test'],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException([
						{ key: 'validations.id.invalid.format', args: { property: 'id', value: undefined } },
						{ key: 'validations.string.invalid.uppercase', args: { property: 'name', value: 'test' } },
						{
							key: 'validations.permission.invalid.format',
							args: { property: 'permissions', value: 'test', permissions: PERMISSIONS_NAMES.join("', '") },
						},
					]),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).patch('/roles').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						id: 9999,
						name: 'TEST',
						permissions: ['ROOT'],
					})
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.role.not_found', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role is updated', async () => {
				const role_id = (await em.findOne(Role, { name: 'TEST_ROLE' })).id;
				const response = await request(server)
					.patch('/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						id: role_id,
						name: 'TEST_TEST_ROLE',
						permissions: ['ROOT', 'CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
					})
					.expect(200);

				expect(response.body).toEqual({
					id: role_id,
					created: expect.any(String),
					updated: expect.any(String),
					name: 'TEST_TEST_ROLE',
					revoked: false,
					permissions: ['ROOT', 'CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
					users_count: 0,
				});
			});
		});
	});

	describe('(GET) /roles/:roles_id', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(server)
					.get('/roles/invalid')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: 'invalid' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/roles/1').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/roles/9999')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.role.not_found', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role exist', async () => {
				const response = await request(server)
					.get('/roles/1')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				expect(response.body).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					name: 'PERMISSIONS_MODERATOR',
					revoked: false,
					permissions: [
						'CAN_READ_PERMISSIONS_OF_USER',
						'CAN_EDIT_PERMISSIONS_OF_USER',
						'CAN_READ_PERMISSIONS_OF_ROLE',
						'CAN_EDIT_PERMISSIONS_OF_ROLE',
					],
					users_count: 1,
				});
			});
		});
	});

	describe('(GET) /roles/:roles_id/users', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(server)
					.get('/roles/invalid/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: 'invalid' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/roles/1/users').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/roles/9999/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.role.not_found', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role exist', async () => {
				const response = await request(server)
					.get('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				expect(response.body).toEqual([
					{
						id: 5,
						nickname: null,
						first_name: 'perms',
						last_name: 'moderator',
						created: expect.any(String),
						updated: expect.any(String),
						role_expires: expect.any(String),
					},
				]);
			});
		});
	});

	describe('(POST) /roles/:roles_id/users', () => {
		describe('400 : Bad Request', () => {
			it('when the role id is invalid', async () => {
				const response = await request(server)
					.post('/roles/invalid/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [
							{
								id: 1,
								expires: new Date('9021-01-01').toISOString(),
							},
							{
								id: 2,
								expires: new Date('9022-01-01').toISOString(),
							},
							{
								id: 3,
								expires: new Date('9023-01-01').toISOString(),
							},
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: 'invalid' }),
				});
			});

			it('when one of the body is invalid', async () => {
				const response = await request(server)
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [
							{
								id: 'invalid',
								expires: new Date('9021-01-01').toISOString(),
							},
							'test',
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException([
						{ key: 'validations.id.invalid.format', args: { property: 'users.0.id', value: 'invalid' } },
						{
							key: 'validations.array.invalid.format',
							args: { property: 'users.1', value: 'test', type: InputUpdateRoleUserDTO.name },
						},
					]),
				});
			});

			it('when no users info are given', async () => {
				const response = await request(server)
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [] })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.array.invalid.not_empty', { property: 'users' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).post('/roles/1/users').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.post('/roles/9999/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [{ id: 1, expires: new Date('9021-01-01').toISOString() }] })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.role.not_found', { id: 9999 }),
				});
			});

			it('when the user does not exist', async () => {
				const response = await request(server)
					.post('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [{ id: 9999, expires: new Date('9021-01-01').toISOString() }] })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.users.not_found.ids', { ids: '9999' }),
				});
			});
		});

		describe('201 : Created', () => {
			it('should add the users to the role', async () => {
				const role_id = (await em.findOne(Role, { name: 'TEST_TEST_ROLE' })).id;
				const response = await request(server)
					.post(`/roles/${role_id}/users`)
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({
						users: [
							{ id: 1, expires: new Date('9021-01-01').toISOString() },
							{ id: 2, expires: new Date('9022-01-01').toISOString() },
						],
					})
					.expect(201);

				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThan(0);
				expect(body.isUniform()).toBe(true);

				expect(body[0]).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					role_expires: '9021-01-01T00:00:00.000Z',
					first_name: 'root',
					last_name: 'root',
					nickname: 'noot noot',
				});

				expect(body[1]).toEqual({
					id: 2,
					created: expect.any(String),
					updated: expect.any(String),
					role_expires: '9022-01-01T00:00:00.000Z',
					first_name: 'unverified',
					last_name: 'user',
					nickname: null,
				});
			});
		});
	});

	describe('(DELETE) /roles/:roles_id/users', () => {
		describe('400 : Bad Request', () => {
			it('when the id is invalid', async () => {
				const response = await request(server)
					.delete('/roles/invalid/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [1, 2, 3] })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: 'invalid' }),
				});
			});

			it('when the user id is invalid', async () => {
				const response = await request(server)
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: ['invalid'] })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', {
						property: 'users',
						value: 'invalid',
					}),
				});
			});

			it('when no user ids are given', async () => {
				const response = await request(server)
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [] })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.array.invalid.not_empty', { property: 'users' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).delete('/roles/1/users').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.delete('/roles/9999/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [1, 2, 3] })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.role.not_found', { id: 9999 }),
				});
			});

			it('when the user does not exist', async () => {
				const response = await request(server)
					.delete('/roles/1/users')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [9999] })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.users.not_found.ids', { ids: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the role exist and the users are removed', async () => {
				const role_id = (await em.findOne(Role, { name: 'TEST_TEST_ROLE' })).id;

				// Check that the user has the role
				const response1 = await request(server)
					.get('/users/2/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				expect(response1.body).toEqual([
					{
						id: role_id,
						created: expect.any(String),
						expires: expect.any(String),
						name: 'TEST_TEST_ROLE',
						permissions: ['ROOT', 'CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
						revoked: false,
						updated: expect.any(String),
					},
				]);

				// check that the users are removed
				const response2 = await request(server)
					.delete(`/roles/${role_id}/users`)
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.send({ users: [2] })
					.expect(200);

				const body = response2.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toEqual(1);
				expect(body.isUniform()).toBe(true);

				expect(body[0]).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					nickname: 'noot noot',
					role_expires: expect.any(String),
				});

				// check that the role has been revoked
				const response3 = await request(server)
					.get('/users/2/roles')
					.set('Authorization', `Bearer ${tokenRolesModerator}`)
					.expect(200);

				expect(response3.body).toEqual([
					{
						id: role_id,
						created: expect.any(String),
						expires: expect.any(String),
						name: 'TEST_TEST_ROLE',
						permissions: ['ROOT', 'CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
						revoked: true, // this is the only difference
						updated: expect.any(String),
					},
				]);
			});
		});
	});
});
