import request from 'supertest';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { OutputTokenDTO } from '@modules/auth/dto/output.dto';
import { i18nBadRequestException, i18nNotFoundException } from '@modules/base/http-errors';
import { Permission } from '@modules/permissions/entities/permission.entity';

import { server, orm } from '..';

describe('Permissions (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenPermissionModerator: string;
	let em: typeof orm.em;

	beforeAll(async () => {
		em = orm.em.fork();
		type res = Omit<request.Response, 'body'> & { body: OutputTokenDTO };

		const resA: res = await request(server).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: res = await request(server).post('/auth/login').send({
			email: 'perms@email.com',
			password: 'root',
		});

		tokenPermissionModerator = resB.body.token;
	});

	describe('(POST) /permissions', () => {
		describe('400 : Bad Request', () => {
			it('when the permission is not valid', async () => {
				const response = await request(server)
					.post('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ id: 1, permission: 'INVALID', expires: new Date() })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.permission.invalid.format', {
						property: 'permission',
						value: 'INVALID',
						permissions: PERMISSIONS_NAMES.join("', '"),
					}),
				});
			});

			it('when a field is missing', async () => {
				const response = await request(server)
					.post('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ id: 1, permission: 'ROOT' })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.date.invalid.format', { property: 'expires', value: undefined }),
				});
			});

			it('when the permission already exist on the user', async () => {
				const response = await request(server)
					.post('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ id: 1, permission: 'ROOT', expires: new Date() })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.permission.invalid.already_on', {
						permission: 'ROOT',
						name: 'root root',
					}),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).post('/permissions').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.post('/permissions')
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
			it('when the user does not exist', async () => {
				const response = await request(server)
					.post('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ id: 999999, permission: 'ROOT', expires: new Date() })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 999999 }),
				});
			});
		});

		describe('201 : Created', () => {
			it('when the permission is added to the user', async () => {
				const response = await request(server)
					.post('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ id: 1, permission: 'CAN_EDIT_PROMOTION', expires: new Date() })
					.expect(201);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					expires: expect.any(String),
					name: 'CAN_EDIT_PROMOTION',
					revoked: false,
					updated: expect.any(String),
					user_id: 1,
				});

				// Remove the permission after the test
				const permission = await em.findOneOrFail(Permission, { name: 'CAN_EDIT_PROMOTION', user: 1 });
				em.remove(permission);
				await em.flush();
				// ------------------------------
			});
		});
	});

	describe('(PATCH) /permissions', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).patch('/permissions').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.patch('/permissions')
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
			it('when the user does not exist', async () => {
				const response = await request(server)
					.patch('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ user_id: 999999, id: 1, name: 'ROOT', expires: new Date(), revoked: false })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 999999 }),
				});
			});

			it('when permission ID does not exist', async () => {
				const response = await request(server)
					.patch('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ user_id: 1, id: 999999, name: 'ROOT', expires: new Date(), revoked: false })
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.permission.not_found', { id: 999999, name: 'root root' }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the permission is updated', async () => {
				const response = await request(server)
					.patch('/permissions')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.send({ user_id: 1, id: 1, name: 'ROOT', expires: new Date('9999-12-31'), revoked: false })
					.expect(200);

				expect(response.body).toEqual({
					id: 1,
					created: expect.any(String),
					expires: expect.any(String),
					name: 'ROOT',
					revoked: false,
					updated: expect.any(String),
					user_id: 1,
				});
			});
		});
	});

	describe('(GET) /permissions/:id', () => {
		describe('400 : Bad Request', () => {
			it('when the user ID is not valid', async () => {
				const response = await request(server)
					.get('/permissions/abc')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'id', value: 'abc' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/permissions/1').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.get('/permissions/1')
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
			it('when the user does not exist', async () => {
				const response = await request(server)
					.get('/permissions/999999')
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 999999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user exists', async () => {
				const response = await request(server)
					.get(`/permissions/1`)
					.set('Authorization', `Bearer ${tokenPermissionModerator}`)
					.expect(200);

				expect(response.body).toEqual([
					{
						created: expect.any(String),
						expires: expect.any(String),
						id: 1,
						name: 'ROOT',
						revoked: false,
						updated: expect.any(String),
						user_id: 1,
					},
				]);
			});
		});
	});
});
