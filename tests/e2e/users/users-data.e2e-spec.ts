import request from 'supertest';

import { UserPostByAdminDTO } from '@modules/auth/dto/register.dto';
import { TokenDTO } from '@modules/auth/dto/token.dto';

import { app, t } from '../..';

describe('Users Data (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenVerified: string;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: TokenDTO };

		const responseA: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = responseA.body.token;

		const responseB: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'ae.info@utbm.fr',
			password: 'root',
		});

		tokenVerified = responseB.body.token;
	});

	describe('(POST) /users', () => {
		describe('400 : Bad Request', () => {
			it('when a field is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenVerified}`)
					.send({
						first_name: 'John',
						last_name: 'Doe',
						birth_date: new Date('1990-01-01'),
					})
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Field.Missing(UserPostByAdminDTO, 'email'),
				});
			});

			it('when the email is already used', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenVerified}`)
					.send({
						email: 'ae.info@utbm.fr',
						first_name: 'John',
						last_name: 'Doe',
						birth_date: new Date('1990-01-01'),
					})
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Email.AlreadyUsed('ae.info@utbm.fr'),
				});
			});

			it('when the email is blacklisted', async () => {
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenVerified}`)
					.send({
						email: 'any@utbm.fr',
						first_name: 'John',
						last_name: 'Doe',
						birth_date: new Date('1990-01-01'),
					})
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
					.set('Authorization', `Bearer ${tokenVerified}`)
					.send({
						email: 'example123@domain.com',
						first_name: 'John',
						last_name: 'Doe',
						birth_date: date,
					})
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
					.send({
						email: 'any@example.com',
						first_name: 'John',
						last_name: 'Doe',
						birth_date: new Date('1990-01-01'),
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
				const response = await request(app.getHttpServer())
					.post('/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.send({
						email: 'any@example.com',
						first_name: 'John',
						last_name: 'Doe',
						birth_date: new Date('1990-01-01'),
					})
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					message: 'Forbidden resource',
					statusCode: 403,
				});
			});
		});
		// describe('200 : Ok', () => {});
	});
});
