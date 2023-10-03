import type { email } from '#types';

import { hashSync } from 'bcrypt';
import request from 'supertest';

import { USER_GENDER } from '@exported/api/constants/genders';
import { UserPostDTO } from '@modules/auth/dto/register.dto';
import { User } from '@modules/users/entities/user.entity';
import { generateRandomPassword } from '@utils/password';

import { orm, app, t } from '..';

describe('Auth (e2e)', () => {
	describe('(POST) /auth/login', () => {
		describe('400 : Bad Request', () => {
			it('when email/password is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/login')
					.send({ password: 'password' })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: {
						_errors: [],
						email: {
							_errors: ['Required'],
						},
					},
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when password is incorrect', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/login')
					.send({ email: 'ae.info@utbm.fr', password: '' })
					.expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: t.Errors.Password.Mismatch(),
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when user is not found', async () => {
				const email: email = 'doesnotexist@utbm.fr';
				const response = await request(app.getHttpServer())
					.post('/auth/login')
					.send({ email, password: '' })
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Email.NotFound(User, email),
				});
			});
		});

		describe('201 : Created', () => {
			it('when user is found and password is correct', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/login')
					.send({ email: 'ae.info@utbm.fr', password: 'root' })
					.expect(201);

				expect(response.body).toEqual({
					token: expect.any(String),
					user_id: expect.any(Number),
				});
			});
		});
	});

	describe('(POST) /auth/register', () => {
		const user: UserPostDTO = {
			first_name: 'John',
			last_name: 'Doe',
			email: 'johndoe@domain.com',
			password: generateRandomPassword(),
			birth_date: new Date('2000-01-01'),
		};

		describe('400 : Bad Request', () => {
			it('when the birth date is in the future', async () => {
				const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);

				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, birth_date: tomorrow })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.BirthDate.Invalid(tomorrow),
				});
			});

			it('when the user age is less than 13 years old', async () => {
				const birth_date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 12);

				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, birth_date })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.BirthDate.Invalid(birth_date),
				});
			});

			it('when the password is too weak', async () => {
				const password = 'short';
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, password })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Password.Weak(),
				});
			});

			it('when the email is not valid', async () => {
				const email = 'invalid';
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, email })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: {
						_errors: [],
						email: {
							_errors: ['Invalid email'],
						},
					},
				});
			});

			it('when the email is blacklisted', async () => {
				const email = 'user@utbm.fr';
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, email })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.Blacklisted(email as unknown as email),
				});
			});

			it('when the email is already used', async () => {
				const email: email = 'ae.info@utbm.fr';
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, email })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.IsAlreadyUsed(email),
				});
			});

			it('when one of required fields is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, first_name: undefined })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: {
						_errors: [],
						first_name: {
							_errors: ['Required'],
						},
					},
				});
			});

			it('when one unexpected field is given', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user, never_gonna: 'give_you_up' })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: {
						_errors: ["Unrecognized key(s) in object: 'never_gonna'"],
					},
				});
			});
		});

		describe('201 : Created', () => {
			it('when user is created', async () => {
				const response = await request(app.getHttpServer())
					.post('/auth/register')
					.send({ ...user })
					.expect(201);

				expect(response.body).toEqual({
					age: (() => {
						const diff = Date.now() - user.birth_date.getTime();
						const age = new Date(diff);
						return Math.abs(age.getUTCFullYear() - 1970);
					})(),
					birth_date: '2000-01-01T00:00:00.000Z',
					created: expect.any(String),
					last_seen: expect.any(String),
					email: 'johndoe@domain.com',
					email_verified: false,
					files_visibility_groups: [],
					first_name: 'John',
					full_name: 'John Doe',
					id: expect.any(Number),
					gender: USER_GENDER[0],
					is_minor: false,
					last_name: 'Doe',
					logs: [],
					permissions: [],
					roles: [],
					updated: expect.any(String),
				});
			});
		});
	});

	describe('(GET) /auth/confirm/:user_id/:token', () => {
		// Defined in the seeder class (unverified user)
		const user_id = 2;
		const token = 'token67891012';

		describe('400 : Bad Request', () => {
			it('when the "user_id" is not a number', async () => {
				const fakeId = 'invalid';
				const response = await request(app.getHttpServer()).get(`/auth/confirm/${fakeId}/${token}`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, fakeId),
				});
			});

			it('when the "token" is invalid', async () => {
				const token = ' ';
				const response = await request(app.getHttpServer()).get(`/auth/confirm/1/${token}/`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.JWT.Invalid(),
				});
			});

			it("when the user's email is already verified", async () => {
				const response = await request(app.getHttpServer()).get(`/auth/confirm/1/anything1012`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.AlreadyVerified(User),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the token is invalid', async () => {
				const response = await request(app.getHttpServer()).get(`/auth/confirm/${user_id}/invalid_token`).expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: t.Errors.Email.InvalidVerificationToken(),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when email is verified', async () => {
				const response = await request(app.getHttpServer()).get(`/auth/confirm/${user_id}/${token}`).expect(200);

				expect(response.body).toEqual({
					age: expect.any(Number),
					banner: null,
					birth_date: '2000-01-01T00:00:00.000Z',
					created: expect.any(String),
					email: 'unverified@email.com',
					email_verified: true,
					first_name: 'unverified',
					full_name: 'unverified user',
					gender: USER_GENDER[0],
					id: user_id,
					is_minor: false,
					last_name: 'user',
					last_seen: expect.any(String),
					nickname: null,
					parent_contact: null,
					phone: null,
					picture: null,
					promotion: null,
					pronouns: null,
					secondary_email: null,
					updated: expect.any(String),
				});

				// Reset user email_verified to false (for other tests)
				const user = await orm.em.findOne(User, { id: user_id });

				user.email_verified = false;
				user.email_verification = hashSync(token, 10);

				await orm.em.persistAndFlush(user);
				orm.em.clear();
				// ------------------------------
			});
		});
	});

	describe('(GET) /auth/verify/:user_id/:token/redirect', () => {
		// Defined in the seeder class (unverified user)
		const user_id = 2;
		const token = 'token67891012';

		describe('400 : Bad Request', () => {
			it('when the "user_id" is not a number', async () => {
				const fakeId = 'invalid';
				const response = await request(app.getHttpServer())
					.get(`/auth/confirm/${fakeId}/${token}/redirect`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, fakeId),
				});
			});

			it('when the "token" is invalid', async () => {
				const token = ' ';
				const response = await request(app.getHttpServer()).get(`/auth/confirm/1/${token}/redirect`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.JWT.Invalid(),
				});
			});

			it("when the user's email is already verified", async () => {
				const response = await request(app.getHttpServer()).get(`/auth/confirm/1/anything1012/redirect`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.AlreadyVerified(User),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the token is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get(`/auth/confirm/${user_id}/invalid_token/redirect`)
					.expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: t.Errors.Email.InvalidVerificationToken(),
				});
			});
		});

		describe('308 : Permanent Redirect', () => {
			it('when redirect is provided', async () => {
				const response = await request(app.getHttpServer())
					.get(`/auth/confirm/${user_id}/${token}/redirect`)
					.expect(308);

				expect((response.header as { location: string }).location).toEqual('https://ae.utbm.fr/');

				// Reset user email_verified to false (for other tests)
				const user = await orm.em.findOne(User, { id: user_id });

				user.email_verified = false;
				user.email_verification = hashSync(token, 10);

				await orm.em.persistAndFlush(user);
				orm.em.clear();
				// ------------------------------
			});
		});
	});
});
