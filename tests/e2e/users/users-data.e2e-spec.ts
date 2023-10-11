import type { email } from '#types';

import request from 'supertest';

import { USER_GENDER } from '@exported/api/constants/genders';
import { TokenDTO } from '@modules/auth/dto/token.dto';
import { User } from '@modules/users/entities/user.entity';

import { orm, app, t } from '../..';

describe('Users Data (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenRoot: string;
	let tokenSubscriber: string;
	let em: typeof orm.em;

	const fakeUserEmail: email = 'john.doe@example.fr';
	type res = Omit<request.Response, 'body'> & { body: TokenDTO };

	beforeAll(async () => {
		em = orm.em.fork();

		const responseA: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = responseA.body.token;

		const responseB: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'ae.info@utbm.fr',
			password: 'root',
		});

		tokenRoot = responseB.body.token;

		const responseC: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'subscriber@email.com',
			password: 'root',
		});

		tokenSubscriber = responseC.body.token;
	});

	describe('(POST) /users', () => {
		describe('400 : Bad Request', () => {
			it('when a field is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
					])
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: {
						0: {
							_errors: [],
							email: {
								_errors: ['Required'],
							},
						},
						_errors: [],
					},
				});
			});

			it('when the email is already used', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							email: 'ae.info@utbm.fr',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
					])
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.IsAlreadyUsed('ae.info@utbm.fr'),
				});
			});

			it('when multiple emails are already used', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							email: 'ae.info@utbm.fr',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
						{
							email: 'unverified@email.com',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
					])
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.AreAlreadyUsed(['ae.info@utbm.fr', 'unverified@email.com']),
				});
			});

			it('when the email is blacklisted', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							email: 'any@utbm.fr',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
					])
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.Blacklisted('any@utbm.fr'),
				});
			});

			it('when the user age is less than 13 years old', async () => {
				const date = new Date();

				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							email: 'example123@domain.com',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: date,
						},
					])
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.BirthDate.Invalid(date),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.send([
						{
							email: 'any@example.com',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
					])
					.expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.send([
						{
							email: 'any@example.com',
							first_name: 'John',
							last_name: 'Doe',
							birth_date: new Date('1990-01-01'),
						},
					])
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('201 : Created', () => {
			it('when the user is created', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							email: fakeUserEmail,
							birth_date: new Date('2001-01-01'),
							first_name: 'John',
							last_name: 'Doe',
						},
					])
					.expect(201);

				expect(response.body).toEqual([
					{
						id: expect.any(Number),
						created: expect.any(String),
						updated: expect.any(String),
						first_name: 'John',
						last_name: 'Doe',
						email_verified: true,
						files_visibility_groups: [],
						full_name: 'John Doe',
						email: fakeUserEmail,
						birth_date: '2001-01-01T00:00:00.000Z',
						age: expect.any(Number),
						is_minor: false,
						gender: USER_GENDER[0],
						last_seen: expect.any(String),
						logs: [],
						permissions: [],
						roles: [],
					},
				]);
			});
		});
	});

	describe('(PATCH) /users', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							id: 'abc',
						},
					])
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.send([
						{
							id: 1,
						},
					])
					.expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});

			it('when the user try to change its own birth date', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							id: 1,
							birth_date: new Date('2001-01-01'),
						},
					])
					.expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: t.Errors.User.CannotUpdateBirthDateOrName(),
				});
			});

			it('when the user try to change its own first name', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							id: 1,
							first_name: 'John',
						},
					])
					.expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: t.Errors.User.CannotUpdateBirthDateOrName(),
				});
			});

			it('when the user try to change its own last name', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							id: 1,
							last_name: 'Smith',
						},
					])
					.expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: t.Errors.User.CannotUpdateBirthDateOrName(),
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.send([
						{
							id: 1,
						},
					])
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							id: 9999,
						},
					])
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFound(User, 9999),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is updated', async () => {
				// get user before updating it to restore it after
				const user = await em.findOne(User, { email: fakeUserEmail });

				// -> we are updating a user that is not the authenticated one => expect 200
				const response = await request(app.getHttpServer())
					.patch('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send([
						{
							id: user.id,
							birth_date: new Date('1990-01-01').toISOString(),
							email: 'john.doe@example.fr',
						},
					])
					.expect(200);

				expect(response.body).toEqual([
					{
						id: expect.any(Number),
						created: expect.any(String),
						updated: expect.any(String),
						first_name: 'John',
						last_name: 'Doe',
						full_name: 'John Doe',
						email: 'john.doe@example.fr',
						email_verified: true,
						gender: USER_GENDER[0],
						birth_date: '1990-01-01T00:00:00.000Z',
						age: expect.any(Number),
						is_minor: false,
						last_seen: expect.any(String),
						nickname: null,
						parent_contact: null,
						phone: null,
						banner: null,
						picture: null,
						promotion: null,
						pronouns: null,
						secondary_email: null,
						verified: null,
					},
				]);

				// restore user
				await em.persistAndFlush(user);
			});
		});
	});

	describe('(DELETE) /users/:id', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.delete('/users/abc')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).delete('/users/1').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.delete('/users/1')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});

			it('when the user is authorized but try to delete another user', async () => {
				const response = await request(app.getHttpServer())
					.delete('/users/9999')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the use delete itself', async () => {
				const user = await em.findOne(User, { email: fakeUserEmail });

				const auth: res = await request(app.getHttpServer()).post('/auth/login').send({
					email: user.email,
					password: user.password,
				});

				const token = auth.body.token;
				const response = await request(app.getHttpServer())
					.delete(`/users/${user.id}`)
					.set('Authorization', `Bearer ${token}`)
					.expect(200);

				expect(response.body).toEqual({
					statusCode: 200,
					message: t.Success.Entity.Deleted(User),
				});
			});
		});
	});

	describe('(GET) /:id/data', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/abc/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/users/1/data').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/data')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});

			it('when the user is authenticated but try to get another user data', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/data')
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/9999/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFound(User, 9999),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user as permission to get the private data', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/2/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toEqual({
					id: 2,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'unverified',
					last_name: 'user',
					email_verified: false,
					picture: null,
					banner: null,
					email: 'unverified@email.com',
					birth_date: '2000-01-01T00:00:00.000Z',
					nickname: null,
					gender: 'OTHER',
					pronouns: null,
					promotion: null,
					last_seen: expect.any(String),
					secondary_email: null,
					phone: null,
					parent_contact: null,
					full_name: 'unverified user',
					age: expect.any(Number),
					is_minor: false,
					verified: null,
				});
			});

			it('when the user is asking for himself', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/1/data') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					email_verified: true,
					picture: null,
					banner: null,
					email: 'ae.info@utbm.fr',
					birth_date: '2000-01-01T00:00:00.000Z',
					nickname: 'noot noot',
					gender: 'OTHER',
					pronouns: null,
					promotion: 21,
					last_seen: expect.any(String),
					secondary_email: null,
					phone: null,
					parent_contact: null,
					full_name: 'root root',
					age: expect.any(Number),
					is_minor: false,
					verified: expect.any(String),
				});
			});
		});
	});

	describe('(GET) /:id/data/public', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/abc/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/users/1/data/public').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/data/public')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/9999/data/public')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFound(User, 9999),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/1/data/public') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					email_verified: true,
					picture: null,
					banner: null,
					birth_date: expect.any(String),
					nickname: 'noot noot',
					promotion: 21,
					last_seen: expect.any(String),
					full_name: 'root root',
					age: expect.any(Number),
					is_minor: false,
					verified: expect.any(String),
				});
			});

			it('when the user is asking for another user', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/1/data/public')
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(200);

				expect(user.body).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					email_verified: true,
					picture: null,
					banner: null,
					birth_date: expect.any(String),
					nickname: 'noot noot',
					promotion: 21,
					last_seen: expect.any(String),
					full_name: 'root root',
					age: expect.any(Number),
					is_minor: false,
					verified: expect.any(String),
				});
			});
		});
	});

	describe('(GET) /:id/data/visibility', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/abc/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/users/1/data/visibility').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/data/visibility')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/9999/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFounds(User, [9999]),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/1/data/visibility') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user: 1,
					email: false,
					secondary_email: false,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parent_contact: false,
				});
			});

			it('when the user has permission to get the private data', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/3/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user: 3,
					email: false,
					secondary_email: false,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parent_contact: false,
				});
			});
		});
	});

	describe('(PATCH) /:id/data/visibility', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users/abc/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						email: true,
					})
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).patch('/users/1/data/visibility').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users/1/data/visibility')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.send({ email: true })
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users/9999/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						email: true,
						secondary_email: true,
						birth_date: true,
						gender: false,
						pronouns: false,
						promotion: true,
						phone: false,
						parent_contact: false,
					})
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFound(User, 9999),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is editing for himself', async () => {
				const response = await request(app.getHttpServer())
					.patch('/users/1/data/visibility') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						email: true,
						secondary_email: true,
						birth_date: true,
						gender: false,
						pronouns: false,
						promotion: true,
						phone: false,
						parent_contact: false,
					})
					.expect(200);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user: 1,
					email: true,
					secondary_email: true,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parent_contact: false,
				});
			});

			it('when the user has permission to set the private data', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/3/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						email: false,
						secondary_email: false,
						birth_date: true,
						gender: false,
						pronouns: false,
						promotion: true,
						phone: false,
						parent_contact: false,
					})
					.expect(200);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user: 3,
					email: false,
					secondary_email: false,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parent_contact: false,
				});
			});
		});
	});

	describe('(GET) /:id/roles', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/abc/roles')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/users/1/roles').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/roles')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/9999/roles')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFound(User, 9999),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/8/roles') // root user id = 1
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(200);

				expect(user.body).toEqual([
					{
						id: 4,
						created: expect.any(String),
						updated: expect.any(String),
						name: 'SUBSCRIBER',
						revoked: false,
						permissions: ['CAN_READ_USER', 'CAN_READ_PROMOTION', 'CAN_READ_FILE'],
						expires: expect.any(String),
					},
				]);
			});

			it('when the user has permission to get the data', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/8/roles') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual([
					{
						id: 4,
						created: expect.any(String),
						updated: expect.any(String),
						name: 'SUBSCRIBER',
						revoked: false,
						permissions: ['CAN_READ_USER', 'CAN_READ_PROMOTION', 'CAN_READ_FILE'],
						expires: expect.any(String),
					},
				]);
			});
		});
	});

	describe('(GET) /:id/permissions', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/abc/permissions')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'abc'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/users/1/permissions').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/permissions')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/9999/permissions')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					message: t.Errors.Id.NotFound(User, 9999),
					statusCode: 404,
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/1/permissions') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual([
					{
						id: 1,
						created: expect.any(String),
						updated: expect.any(String),
						name: 'ROOT',
						revoked: false,
						expires: '9999-12-31T00:00:00.000Z',
						user: 1,
					},
				]);
			});

			it('when the user has permission to get the data', async () => {
				const user = await request(app.getHttpServer())
					.get('/users/8/permissions') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual([]);
			});
		});
	});
});
