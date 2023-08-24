import type { email } from '@types';

import { hashSync } from 'bcrypt';
import request from 'supertest';

import { Errors } from '@i18n';
import { UserPostDTO } from '@modules/auth/dto/register.dto';
import { User } from '@modules/users/entities/user.entity';
import { generateRandomPassword } from '@utils/password';

import { orm, app, i18n } from '..';

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
					message: Errors.Generic.FieldMissing({ i18n, type: UserPostDTO, field: 'email' }),
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
					message: Errors.Password.Mismatch({ i18n }),
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
					message: Errors.Email.NotFound({ i18n, type: User, email }),
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
					message: Errors.BirthDate.Invalid({ i18n, date: tomorrow }),
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
					message: Errors.BirthDate.Invalid({ i18n, date: birth_date }),
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
					message: Errors.Password.Weak({ i18n }),
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
					message: Errors.Email.Invalid({ i18n, email: email as unknown as email }),
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
					message: Errors.Email.Invalid({ i18n, email: email as unknown as email }),
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
					message: Errors.Email.AlreadyUsed({ i18n, email }),
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
					message: Errors.Generic.FieldMissing({ i18n, type: UserPostDTO, field: 'first_name' }),
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
					message: Errors.Generic.FieldUnexpected({ i18n, type: UserPostDTO, field: 'never_gonna' }),
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
					created_at: expect.any(String),
					last_seen: expect.any(String),
					email: 'johndoe@domain.com',
					email_verified: false,
					files_visibility_groups: [],
					first_name: 'John',
					full_name: 'John Doe',
					id: expect.any(Number),
					gender: 'OTHER',
					is_minor: false,
					last_name: 'Doe',
					logs: [],
					permissions: [],
					roles: [],
					updated_at: expect.any(String),
				});
			});
		});
	});

	describe('(GET) /auth/confirm/:user_id/:token/:redirect_url?', () => {
		// Defined in the seeder class (unverified user)
		const user_id = 2;
		const token = 'token';

		describe('400 : Bad Request', () => {
			it('when the "user_id" is not a number', async () => {
				const fakeId = 'invalid';
				const response = await request(app.getHttpServer()).get(`/auth/confirm/${fakeId}/${token}`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: Errors.Generic.FieldInvalid({ i18n, type: Number, field: 'user_id' }),
				});
			});

			it('when the "token" is empty', async () => {
				const token = ' ';
				const response = await request(app.getHttpServer()).get(`/auth/confirm/1/${token}/`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: Errors.Generic.FieldInvalid({ i18n, type: String, field: 'token' }),
				});
			});

			it("when the user's email is already verified", async () => {
				const response = await request(app.getHttpServer()).get(`/auth/confirm/1/anything`).expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: Errors.Email.AlreadyVerified({ i18n, type: User }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the token is invalid', async () => {
				const response = await request(app.getHttpServer()).get(`/auth/confirm/${user_id}/invalid_token`).expect(401);

				expect(response.body).toEqual({
					error: 'Unauthorized',
					statusCode: 401,
					message: Errors.Email.InvalidVerificationToken({ i18n }),
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
					created_at: expect.any(String),
					email: 'unverified@email.com',
					email_verified: true,
					first_name: 'unverified',
					full_name: 'unverified user',
					gender: 'OTHER',
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
					updated_at: expect.any(String),
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

		describe('308 : Permanent Redirect', () => {
			it('when "redirect_url" is provided', async () => {
				const response = await request(app.getHttpServer())
					.get(`/auth/confirm/${user_id}/${token}/${encodeURIComponent('https://example.com')}`)
					.expect(308);

				expect((response.header as { location: string }).location).toEqual('https://example.com');

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
