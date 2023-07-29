import request from 'supertest';

import { Errors } from '@i18n';
import { TokenDTO } from '@modules/auth/dto/token.dto';
import { PermissionPostDTO, RolePermissionsDto } from '@modules/permissions/dto/post.dto';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { User } from '@modules/users/entities/user.entity';

import { app, i18n, orm } from '..';

describe('Permissions (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenPermissionModerator: string;

	beforeAll(async () => {
		type Res = Omit<request.Response, 'body'> & { body: TokenDTO };

		const resA: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'perms@email.com',
			password: 'root',
		});

		tokenPermissionModerator = resB.body.token;
	});

	describe('/api/permissions/user (POST)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).post('/api/permissions/user').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the user does not exist', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ id: 999999, permission: 'ROOT', expires: new Date() })
				.expect(404);

			expect(response.body).toEqual({
				statusCode: 404,
				error: 'Not Found',
				message: Errors.Generic.IdNotFound({ i18n, id: 999999, type: User }),
			});
		});

		it('should return 400 when the permission is not valid', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ id: 1, permission: 'INVALID', expires: new Date() })
				.expect(400);

			expect(response.body).toEqual({
				statusCode: 400,
				error: 'Bad Request',
				message: Errors.Permission.Invalid({ i18n, permission: 'INVALID' }),
			});
		});

		it('should return 400 when a field is missing', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ id: 1, permission: 'ROOT' })
				.expect(400);

			expect(response.body).toEqual({
				statusCode: 400,
				error: 'Bad Request',
				message: Errors.Generic.FieldMissing({ i18n, field: 'expires', type: PermissionPostDTO }),
			});
		});

		it('should return 400 when the permission already exist on the user', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ id: 1, permission: 'ROOT', expires: new Date() })
				.expect(400);

			expect(response.body).toEqual({
				statusCode: 400,
				error: 'Bad Request',
				message: Errors.Permission.AlreadyOnUser({ i18n, permission: 'ROOT', user: 'root root' }),
			});
		});

		it('should return 201 when the permission is added to the user', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ id: 1, permission: 'CAN_EDIT_PROMOTION', expires: new Date() })
				.expect(201);

			expect(response.body).toEqual({
				id: expect.any(Number),
				created_at: expect.any(String),
				expires: expect.any(String),
				name: 'CAN_EDIT_PROMOTION',
				revoked: false,
				updated_at: expect.any(String),
				user: 1,
			});

			// Remove the permission after the test
			const permission = await orm.em.findOneOrFail(Permission, { name: 'CAN_EDIT_PROMOTION', user: 1 });
			orm.em.remove(permission);
			await orm.em.flush();
			// ------------------------------
		});
	});

	describe('/api/permissions/user (PATCH)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).patch('/api/permissions/user').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.patch('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the user does not exist', async () => {
			const response = await request(app.getHttpServer())
				.patch('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ user_id: 999999, id: 1, name: 'ROOT', expires: new Date(), revoked: false })
				.expect(404);

			expect(response.body).toEqual({
				statusCode: 404,
				error: 'Not Found',
				message: Errors.Generic.IdNotFound({ i18n, id: 999999, type: User }),
			});
		});

		it('should return 404 when permission ID does not exist', async () => {
			const response = await request(app.getHttpServer())
				.patch('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ user_id: 1, id: 999999, name: 'ROOT', expires: new Date(), revoked: false })
				.expect(404);

			expect(response.body).toEqual({
				statusCode: 404,
				error: 'Not Found',
				message: Errors.Permission.NotFoundOnUser({ i18n, user: 'root root', permission: 'ROOT' }),
			});
		});

		it('should return 200 when the permission is updated', async () => {
			const response = await request(app.getHttpServer())
				.patch('/api/permissions/user')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({ user_id: 1, id: 1, name: 'ROOT', expires: new Date('9999-12-31'), revoked: false })
				.expect(200);

			expect(response.body).toEqual({
				id: 1,
				created_at: expect.any(String),
				expires: expect.any(String),
				name: 'ROOT',
				revoked: false,
				updated_at: expect.any(String),
				user: 1,
			});
		});
	});

	describe('/api/permissions/user/:id (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/permissions/user/1').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/permissions/user/1')
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the user does not exist', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/permissions/user/999999')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.expect(404);

			expect(response.body).toEqual({
				statusCode: 404,
				error: 'Not Found',
				message: Errors.Generic.IdNotFound({ i18n, id: 999999, type: User }),
			});
		});

		it('should return 200 when the user exists', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/permissions/user/1`)
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.expect(200);

			expect(response.body).toEqual([
				{
					created_at: expect.any(String),
					expires: expect.any(String),
					id: 1,
					name: 'ROOT',
					revoked: false,
					updated_at: expect.any(String),
					user: 1,
				},
			]);
		});
	});

	describe('/api/permissions/role (POST)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).post('/api/permissions/role').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/role')
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the role does not exist', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/role')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({
					id: 999999,
					permissions: ['ROOT'],
				})
				.expect(404);

			expect(response.body).toEqual({
				statusCode: 404,
				error: 'Not Found',
				message: Errors.Generic.IdNotFound({ i18n, id: 999999, type: Role }),
			});
		});

		it('should return 400 when the body is empty', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/role')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.expect(400);

			expect(response.body).toEqual({
				statusCode: 400,
				error: 'Bad Request',
				message: Errors.Generic.FieldMissing({ i18n, field: 'permissions', type: RolePermissionsDto }),
			});
		});

		it('should return 400 when one of the permission does not exist', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/role')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({
					id: 1,
					permissions: ['INVALID'],
				})
				.expect(400);

			expect(response.body).toEqual({
				statusCode: 400,
				error: 'Bad Request',
				message: Errors.Permission.Invalid({ i18n, permission: 'INVALID' }),
			});
		});

		it('should return 201 when the body is correct', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/permissions/role')
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.send({
					id: 1,
					permissions: ['ROOT'],
				})
				.expect(201);

			expect(response.body).toEqual({
				created_at: expect.any(String),
				expires: expect.any(String),
				id: 1,
				name: 'PERMISSIONS_MODERATOR',
				permissions: [
					'CAN_READ_PERMISSIONS_OF_USER',
					'CAN_EDIT_PERMISSIONS_OF_USER',
					'CAN_READ_PERMISSIONS_OF_ROLE',
					'CAN_EDIT_PERMISSIONS_OF_ROLE',
					'ROOT',
				],
				revoked: false,
				updated_at: expect.any(String),
			});

			// Remove the permission to avoid problems with other tests
			const role = await orm.em.findOne(Role, { id: 1 });

			role.permissions = role.permissions.remove('ROOT');

			await orm.em.persistAndFlush(role);
			orm.em.clear();
			// ------------------------------
		});
	});

	describe('/api/permissions/role/{role_id} (GET)', () => {
		const roleId = 1;

		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get(`/api/permissions/role/${roleId}`).expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/permissions/role/${roleId}`)
				.set('Authorization', `Bearer ${tokenUnauthorized}`)
				.expect(403);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the role does not exist', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/permissions/role/${9999}`)
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.expect(404);

			expect(response.body).toEqual({
				statusCode: 404,
				error: 'Not Found',
				message: Errors.Generic.IdNotFound({ i18n, type: Role, id: 9999 }),
			});
		});

		it('should return 200 when the user is authorized', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/permissions/role/${roleId}`)
				.set('Authorization', `Bearer ${tokenPermissionModerator}`)
				.expect(200);

			expect(response.body).toEqual([
				'CAN_READ_PERMISSIONS_OF_USER',
				'CAN_EDIT_PERMISSIONS_OF_USER',
				'CAN_READ_PERMISSIONS_OF_ROLE',
				'CAN_EDIT_PERMISSIONS_OF_ROLE',
			]);
		});
	});
});
