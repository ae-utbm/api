import type { email } from '#types';

import request from 'supertest';

import { OutputMessageDTO } from '@modules/_mixin/dto/output.dto';
import { i18nBadRequestException, i18nNotFoundException, i18nUnauthorizedException } from '@modules/_mixin/http-errors';
import { OutputTokenDTO } from '@modules/auth/dto/output.dto';
import { User } from '@modules/users/entities/user.entity';

import { orm, server } from '../..';

describe('Users Data (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenRoot: string;
	let tokenSubscriber: string;
	let tokenPerms: string;
	let em: typeof orm.em;

	const fakeUserEmail: email = 'john.doe@example.fr';
	type res = Omit<request.Response, 'body'> & { body: OutputTokenDTO };

	beforeAll(async () => {
		em = orm.em.fork();

		const responseA: res = await request(server).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = responseA.body.token;

		const responseB: res = await request(server).post('/auth/login').send({
			email: 'ae.info@utbm.fr',
			password: 'root',
		});

		tokenRoot = responseB.body.token;

		const responseC: res = await request(server).post('/auth/login').send({
			email: 'subscriber@email.com',
			password: 'root',
		});

		tokenSubscriber = responseC.body.token;

		const responseD: res = await request(server).post('/auth/login').send({
			email: 'perms@email.com',
			password: 'root',
		});

		tokenPerms = responseD.body.token;
	});

	describe('(POST) /users', () => {
		describe('400 : Bad Request', () => {
			it('when a field is missing', async () => {
				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						users: [
							{
								first_name: 'John',
								last_name: 'Doe',
								birth_date: new Date('1990-01-01'),
							},
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.format', {
						property: 'users.0.email',
						value: undefined,
					}),
				});
			});

			it('when the email is already used', async () => {
				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						users: [
							{
								email: 'ae.info@utbm.fr',
								first_name: 'John',
								last_name: 'Doe',
								birth_date: new Date('1990-01-01'),
							},
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.used', { email: 'ae.info@utbm.fr' }),
				});
			});

			it('when multiple emails are already used', async () => {
				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						users: [
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
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.are_used', {
						emails: ['unverified@email.com', 'ae.info@utbm.fr'].join("', '"),
					}),
				});
			});

			it('when the email is blacklisted', async () => {
				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						users: [
							{
								email: 'any@utbm.fr',
								first_name: 'John',
								last_name: 'Doe',
								birth_date: new Date('1990-01-01'),
							},
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.blacklisted', {
						property: 'users.0.email',
						value: 'any@utbm.fr',
					}),
				});
			});

			it('when the user age is less than 13 years old', async () => {
				const date = new Date();

				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						users: [
							{
								email: 'example123@domain.com',
								first_name: 'John',
								last_name: 'Doe',
								birth_date: date,
							},
						],
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.birth_date.invalid.outbound', { date: date.toISOString() }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server)
					.post('/users')
					.send({
						users: [
							{
								email: 'any@example.com',
								first_name: 'John',
								last_name: 'Doe',
								birth_date: new Date('1990-01-01'),
							},
						],
					})
					.expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.send({
						users: [
							{
								email: 'any@example.com',
								first_name: 'John',
								last_name: 'Doe',
								birth_date: new Date('1990-01-01'),
							},
						],
					})
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
				const response = await request(server)
					.post('/users')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						users: [
							{
								email: fakeUserEmail,
								birth_date: new Date('2001-01-01'),
								first_name: 'John',
								last_name: 'Doe',
							},
						],
					})
					.expect(201);

				expect(response.body).toEqual([
					{
						id: expect.any(Number),
						created: expect.any(String),
						updated: expect.any(String),
						first_name: 'John',
						last_name: 'Doe',
					},
				]);
			});
		});
	});

	describe('(PATCH) /users', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.patch('/users/abc')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});

			it('when the user email is already used', async () => {
				const response = await request(server)
					.patch('/users/1')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						email: 'unverified@email.com',
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.used', { email: 'unverified@email.com' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).patch('/users/1').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});

			it('when the user try to change its own birth date', async () => {
				const response = await request(server)
					.patch('/users/1')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						birth_date: new Date('2001-01-01'),
					})
					.expect(401);

				expect(response.body).toEqual({
					...new i18nUnauthorizedException('validations.user.cannot_update'),
				});
			});

			it('when the user try to change its own first name', async () => {
				const response = await request(server)
					.patch('/users/1')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						first_name: 'John',
					})
					.expect(401);

				expect(response.body).toEqual({
					...new i18nUnauthorizedException('validations.user.cannot_update'),
				});
			});

			it('when the user try to change its own last name', async () => {
				const response = await request(server)
					.patch('/users/1')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						last_name: 'Smith',
					})
					.expect(401);

				expect(response.body).toEqual({
					...new i18nUnauthorizedException('validations.user.cannot_update'),
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.patch('/users/1')
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
				const response = await request(server)
					.patch('/users/9999')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({})
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is updated', async () => {
				// get user before updating it to restore it after
				const user = await em.findOne(User, { email: fakeUserEmail });

				// -> we are updating a user that is not the authenticated one => expect 200
				const response = await request(server)
					.patch(`/users/${user.id}`)
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						birth_date: new Date('1990-01-01').toISOString(),
						email: 'john.doe@example.fr',
					})
					.expect(200);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'John',
					last_name: 'Doe',
					full_name: 'John Doe',
					birth_date: '1990-01-01T00:00:00.000Z',
					age: expect.any(Number),
					is_minor: false,
					nickname: null,
					promotion: null,
					last_seen: expect.any(String),
				});

				// restore user
				await em.persistAndFlush(user);
			});
		});
	});

	describe('(DELETE) /users/:id', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.delete('/users/abc')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).delete('/users/1').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
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
			it('when the user delete itself', async () => {
				const user = await em.findOne(User, { email: fakeUserEmail });

				// Verify user before deleting it (otherwise it can't delete itself)
				user.verified = new Date();
				await em.persistAndFlush(user);

				const auth: res = await request(server).post('/auth/login').send({
					email: user.email,
					password: user.password,
				});

				const token = auth.body.token;
				const response = await request(server)
					.delete(`/users/${user.id}`)
					.set('Authorization', `Bearer ${token}`)
					.expect(200);

				expect(response.body).toEqual({
					...new OutputMessageDTO('validations.user.success.deleted', { name: 'John Doe' }),
				});
			});
		});
	});

	describe('(GET) /:id/data', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.get('/users/abc/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/data').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
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
				const response = await request(server)
					.get('/users/9999/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user as permission to get the private data', async () => {
				const response = await request(server)
					.get('/users/2/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toEqual({
					id: 2,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'unverified',
					last_name: 'user',
					email: 'unverified@email.com',
					birth_date: '2000-01-01T00:00:00.000Z',
					nickname: null,
					gender: 'OTHER',
					pronouns: null,
					promotion: null,
					last_seen: expect.any(String),
					secondary_email: null,
					phone: null,
					parents_phone: null,
					full_name: 'unverified user',
					age: expect.any(Number),
					is_minor: false,
				});
			});

			it('when the user is asking for himself', async () => {
				const user = await request(server)
					.get('/users/1/data') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					email: 'ae.info@utbm.fr',
					birth_date: '2000-01-01T00:00:00.000Z',
					nickname: 'noot noot',
					gender: 'OTHER',
					pronouns: null,
					promotion: 21,
					last_seen: expect.any(String),
					secondary_email: null,
					phone: null,
					parents_phone: null,
					full_name: 'root root',
					age: expect.any(Number),
					is_minor: false,
				});
			});
		});
	});

	describe('(GET) /:id/data/public', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.get('/users/abc/data')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/data/public').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/users/9999/data/public')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(server)
					.get('/users/1/data/public') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: 1,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'root',
					last_name: 'root',
					birth_date: expect.any(String),
					nickname: 'noot noot',
					promotion: 21,
					last_seen: expect.any(String),
					full_name: 'root root',
					age: expect.any(Number),
					is_minor: false,
				});
			});

			it('when the user is asking for another user', async () => {
				const user = await request(server)
					.get('/users/2/data/public')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: 2,
					created: expect.any(String),
					updated: expect.any(String),
					first_name: 'unverified',
					last_name: 'user',
					birth_date: expect.any(String),
					nickname: null,
					promotion: null,
					last_seen: expect.any(String),
					full_name: 'unverified user',
					age: expect.any(Number),
					is_minor: false,
				});
			});
		});
	});

	describe('(GET) /:id/data/visibility', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.get('/users/abc/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/data/visibility').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/users/9999/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(server)
					.get('/users/1/data/visibility') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user_id: 1,
					email: false,
					secondary_email: false,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parents_phone: false,
				});
			});

			it('when the user has permission to get the private data', async () => {
				const user = await request(server)
					.get('/users/3/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user_id: 3,
					email: false,
					secondary_email: false,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parents_phone: false,
				});
			});
		});
	});

	describe('(PATCH) /:id/data/visibility', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.patch('/users/abc/data/visibility')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.send({
						email: true,
					})
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).patch('/users/1/data/visibility').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
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
						parents_phone: false,
					})
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is editing for himself', async () => {
				const response = await request(server)
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
						parents_phone: false,
					})
					.expect(200);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user_id: 1,
					email: true,
					secondary_email: true,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parents_phone: false,
				});
			});

			it('when the user has permission to set the private data', async () => {
				const response = await request(server)
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
						parents_phone: false,
					})
					.expect(200);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created: expect.any(String),
					updated: expect.any(String),
					user_id: 3,
					email: false,
					secondary_email: false,
					birth_date: true,
					gender: false,
					pronouns: false,
					promotion: true,
					phone: false,
					parents_phone: false,
				});
			});
		});
	});

	describe('(GET) /:id/roles', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.get('/users/abc/roles')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/roles').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/users/9999/roles')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(server)
					.get('/users/5/roles') // perms user id = 5
					.set('Authorization', `Bearer ${tokenPerms}`)
					.expect(200);

				expect(user.body).toEqual([
					{
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
						expires: expect.any(String),
					},
				]);
			});

			it('when the user has permission to get the data', async () => {
				const user = await request(server)
					.get('/users/5/roles')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual([
					{
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
						expires: expect.any(String),
					},
				]);
			});
		});
	});

	describe('(GET) /:id/permissions', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is not a number', async () => {
				const response = await request(server)
					.get('/users/abc/permissions')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'abc', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/permissions').expect(401);

				expect(response.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
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
				const response = await request(server)
					.get('/users/9999/permissions')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is asking for himself', async () => {
				const user = await request(server)
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
						user_id: 1,
					},
				]);
			});

			it('when the user has permission to get the data', async () => {
				const user = await request(server)
					.get('/users/8/permissions') // root user id = 1
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(user.body).toEqual([]);
			});
		});
	});
});
