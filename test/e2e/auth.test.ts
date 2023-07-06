import request from 'supertest';
import { app } from '../setup';
import { UserPostDTO } from '@modules/auth/dto/register.dto';

describe('AuthController (e2e)', () => {
	describe('/api/auth/login (POST)', () => {
		it('should return 400 when email/password is not provided', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/login')
				.send({ password: 'password' })
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				message: 'Missing user id/email',
				statusCode: 400,
			});
		});

		it('should return 404 when user is not found', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/login')
				.send({ email: 'doesnotexist@utbm.fr', password: '' })
				.expect(404);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: 'User not found',
			});
		});

		it('should return 401 when password is incorrect', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/login')
				.send({ email: 'ae.info@utbm.fr', password: '' })
				.expect(401);

			expect(response.body).toEqual({
				error: 'Unauthorized',
				statusCode: 401,
				message: 'Password mismatch',
			});
		});

		it('should return 201 when user is found and password is correct', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/login')
				.send({ email: 'ae.info@utbm.fr', password: 'root' })
				.expect(201);

			expect(response.body).toEqual({
				token: expect.any(String),
				user_id: expect.any(Number),
			});
		});
	});

	describe('/api/auth/register (POST)', () => {
		const user: UserPostDTO = {
			first_name: 'John',
			last_name: 'Doe',
			email: 'johndoe@domain.com',
			password: 'password',
			birthday: new Date('2000-01-01'),
		};

		describe('checking the birthday', () => {
			it('should return 400 when birthday is in the future', async () => {
				const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);

				const response = await request(app.getHttpServer())
					.post('/api/auth/register')
					.send({ ...user, birthday: tomorrow })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: `The date '${tomorrow.toISOString()}' is not valid (either too young or in the future)`,
				});
			});

			it('should return 400 when birthday is less than 13 years old', async () => {
				const birthday = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 12);

				const response = await request(app.getHttpServer())
					.post('/api/auth/register')
					.send({ ...user, birthday })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: `The date '${birthday.toISOString()}' is not valid (either too young or in the future)`,
				});
			});
		});

		describe('checking the email', () => {
			it('should return 400 when email is not valid', async () => {
				const response = await request(app.getHttpServer())
					.post('/api/auth/register')
					.send({ ...user, email: 'invalid' })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: "The following email 'invalid' is not allowed (blacklisted or invalid)",
				});
			});

			it('should return 400 when email is blacklisted', async () => {
				const response = await request(app.getHttpServer())
					.post('/api/auth/register')
					.send({ ...user, email: 'user@utbm.fr' })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: "The following email 'user@utbm.fr' is not allowed (blacklisted or invalid)",
				});
			});

			it('should return 400 when email is already used', async () => {
				const response = await request(app.getHttpServer())
					.post('/api/auth/register')
					.send({ ...user, email: 'ae.info@utbm.fr' })
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: "Email 'ae.info@utbm.fr' is already taken",
				});
			});
		});

		it('should return 400 when one of required fields is not provided', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/register')
				.send({ ...user, first_name: undefined })
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: "Missing required field 'first_name'",
			});
		});

		it('should return 400 when one unexpected field is given', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/register')
				.send({ ...user, never_gonna: 'give_you_up' })
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: "Invalid field 'never_gonna', please check the documentation",
			});
		});

		it('should return 201 when user is created', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/register')
				.send({ ...user })
				.expect(201);

			expect(response.body).toEqual({
				age: (() => {
					const diff = Date.now() - user.birthday.getTime();
					const age = new Date(diff);
					return Math.abs(age.getUTCFullYear() - 1970);
				})(),
				birthday: '2000-01-01T00:00:00.000Z',
				created_at: expect.any(String),
				email: 'johndoe@domain.com',
				email_verified: false,
				first_name: 'John',
				full_name: 'John Doe',
				id: expect.any(Number),
				is_currently_subscribed: false,
				is_minor: false,
				last_name: 'Doe',
				logs: [],
				permissions: [],
				roles: [],
				subscriptions: [],
				updated_at: expect.any(String),
			});
		});
	});

	describe('/api/auth/confirm/:user_id/:token/:redirect_url? (GET)', () => {
		// Defined in the seeder class (unverified user)
		const user_id = 2;
		const token = 'token';

		it('should return 400 when user_id is not a number', async () => {
			const response = await request(app.getHttpServer()).get(`/api/auth/confirm/not_a_number/${token}`).expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: 'Invalid user id',
			});
		});

		it('should return 401 when the token is invalid', async () => {
			const response = await request(app.getHttpServer()).get(`/api/auth/confirm/${user_id}/invalid_token`).expect(401);

			expect(response.body).toEqual({
				error: 'Unauthorized',
				statusCode: 401,
				message: 'Invalid email verification token',
			});
		});

		it('should return 400 when email is already verified', async () => {
			const response = await request(app.getHttpServer()).get(`/api/auth/confirm/1/anything`).expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: 'Email is already verified',
			});
		});

		it('should return 200 when email is verified', async () => {
			const response = await request(app.getHttpServer()).get(`/api/auth/confirm/${user_id}/${token}`).expect(200);

			expect(response.body).toEqual({
				age: expect.any(Number),
				banner: null,
				birthday: '2000-01-01T00:00:00.000Z',
				created_at: expect.any(String),
				cursus: null,
				email: 'unverified@email.com',
				email_verified: true,
				first_name: 'unverified',
				full_name: 'unverified unverified',
				gender: null,
				id: user_id,
				is_currently_subscribed: false,
				is_minor: false,
				last_name: 'unverified',
				last_seen: null,
				nickname: null,
				parent_contact: null,
				phone: null,
				picture: null,
				promotion: null,
				pronouns: null,
				secondary_email: null,
				specialty: null,
				subscriber_account: null,
				updated_at: expect.any(String),
			});
		});

		it('should return 308 when redirect_url is provided', async () => {
			const response = await request(app.getHttpServer())
				.get(`/api/auth/confirm/${user_id}/${token}/${encodeURIComponent('https://example.com')}`)
				.expect(308);

			expect(response.header.location).toEqual('https://example.com');
		});
	});
});
