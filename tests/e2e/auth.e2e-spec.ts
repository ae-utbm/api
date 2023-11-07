import type { email } from '#types';

import { hashSync } from 'bcrypt';
import request from 'supertest';

import { InputRegisterUserDTO } from '@modules/auth/dto/input.dto';
import { generateRandomPassword } from '@modules/base/decorators';
import { OutputCreatedDTO, OutputMessageDTO } from '@modules/base/dto/output.dto';
import { i18nForbiddenException, i18nNotFoundException, i18nUnauthorizedException } from '@modules/base/http-errors';
import { i18nBadRequestException } from '@modules/base/http-errors/bad-request';
import { User } from '@modules/users/entities/user.entity';

import { orm, server } from '..';

describe('Auth (e2e)', () => {
	let em: typeof orm.em;
	const fakeToken = 'token67891012'; // from tests.seeder.ts

	beforeAll(() => {
		em = orm.em.fork();
	});

	describe('(POST) /auth/login', () => {
		describe('400 : Bad Request', () => {
			it('when email/password is not provided', async () => {
				const response = await request(server).post('/auth/login').send().expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException([
						{ key: 'validations.email.invalid.format', args: { property: 'email', value: undefined } },
						{ key: 'validations.password.invalid.weak', args: { property: 'password', value: undefined } },
					]),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when password is incorrect', async () => {
				const response = await request(server)
					.post('/auth/login')
					.send({ email: 'ae.info@utbm.fr', password: generateRandomPassword() })
					.expect(401);

				expect(response.body).toEqual({ ...new i18nUnauthorizedException('validations.password.invalid.mismatch') });
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user account is not yet verified', async () => {
				const response = await request(server)
					.post('/auth/login')
					.send({ email: 'unverified@email.com', password: 'root' })
					.expect(403);

				expect(response.body).toEqual({ ...new i18nForbiddenException('validations.user.unverified') });
			});
		});

		describe('404 : Not Found', () => {
			it('when user is not found', async () => {
				const email: email = 'doesnotexist@example.fr';
				const response = await request(server)
					.post('/auth/login')
					.send({ email, password: generateRandomPassword() })
					.expect(404);

				expect(response.body).toEqual({ ...new i18nNotFoundException('validations.user.not_found.email', { email }) });
			});
		});

		describe('201 : Created', () => {
			it('when user is found and password is correct', async () => {
				const response = await request(server)
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
		const user: InputRegisterUserDTO = {
			first_name: 'John',
			last_name: 'Doe',
			email: 'johndoe@domain.com',
			password: generateRandomPassword(),
			birth_date: new Date('2000-01-01'),
		};

		describe('400 : Bad Request', () => {
			it('when the birth date is in the future', async () => {
				const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);

				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, birth_date: tomorrow })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.birth_date.invalid.outbound', { date: tomorrow.toISOString() }),
				});
			});

			it('when the user age is less than 13 years old', async () => {
				const birth_date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 12);

				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, birth_date })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.birth_date.invalid.outbound', { date: birth_date.toISOString() }),
				});
			});

			it('when the password is too weak', async () => {
				const password = 'short';
				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, password })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.password.invalid.weak', { property: 'password', value: 'short' }),
				});
			});

			it('when the email is not valid', async () => {
				const email = 'invalid';
				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, email })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.format', { property: 'email', value: 'invalid' }),
				});
			});

			it('when the email is blacklisted', async () => {
				const email = 'user@utbm.fr';
				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, email })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.email.invalid.blacklisted', { property: 'email', value: email }),
				});
			});

			it('when the email is already used', async () => {
				const email: email = 'ae.info@utbm.fr';
				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, email })
					.expect(400);

				expect(response.body).toEqual({ ...new i18nBadRequestException('validations.email.invalid.used', { email }) });
			});

			it('when one of required fields is not provided', async () => {
				const response = await request(server)
					.post('/auth/register')
					.send({ ...user, first_name: undefined })
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.string.invalid.format', {
						property: 'first_name',
						value: undefined,
					}),
				});
			});
		});

		describe('201 : Created', () => {
			it('when user is created', async () => {
				const response = await request(server)
					.post('/auth/register')
					.send({ ...user })
					.expect(201);

				expect(response.body).toEqual({
					...new OutputCreatedDTO('validations.user.success.registered', {
						name: user.first_name + ' ' + user.last_name,
					}),
				});
			});
		});
	});

	describe('(GET) /auth/confirm/:user_id/:token', () => {
		// Defined in the seeder class (unverified user)
		const user_id = 2;

		describe('400 : Bad Request', () => {
			it('when the "user_id" is not a number', async () => {
				const fakeId = 'invalid';
				const response = await request(server).get(`/auth/confirm/${fakeId}/${fakeToken}`).expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { property: 'user_id', value: fakeId }),
				});
			});

			it("when the user's email is already verified", async () => {
				const response = await request(server).get(`/auth/confirm/1/${fakeToken}`).expect(400);

				expect(response.body).toEqual({ ...new i18nBadRequestException('validations.email.invalid.already_verified') });
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the "token" is invalid', async () => {
				const response = await request(server).get(`/auth/confirm/${user_id}/invalid_token`).expect(401);

				expect(response.body).toEqual({
					...new i18nUnauthorizedException('validations.token.invalid.format'),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when user is verified', async () => {
				const response = await request(server).get(`/auth/confirm/${user_id}/${fakeToken}`).expect(200);

				expect(response.body).toEqual({ ...new OutputMessageDTO('validations.email.success.verified') });

				// Reset user email_verified to false (for other tests)
				const user = await em.findOne(User, { id: user_id });

				user.email_verified = false;
				user.email_verification = hashSync(fakeToken, 10);
				user.verified = null;

				await em.persistAndFlush(user);
				em.clear();
				// ------------------------------
			});
		});
	});
});
