import { join } from 'path';

import request from 'supertest';

import { TokenDTO } from '@modules/auth/dto/token.dto';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';
import { User } from '@modules/users/entities/user.entity';

import { orm, app, t } from '../..';

describe('Users Files (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenRoot: string;
	let tokenSubscriber: string;
	let tokenLogs: string;
	let em: typeof orm.em;

	beforeAll(async () => {
		em = orm.em.fork();
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

		tokenRoot = responseB.body.token;

		const responseC: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'subscriber@email.com',
			password: 'root',
		});

		tokenSubscriber = responseC.body.token;

		const responseD: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'logs@email.com',
			password: 'root',
		});

		tokenLogs = responseD.body.token;
	});

	describe('(GET) /users/:id/picture', () => {
		let picture: UserPicture;

		beforeAll(async () => {
			// Set a fake picture
			const visibility_group = await em.findOne(FileVisibilityGroup, { name: 'SUBSCRIBER' });
			picture = em.create(UserPicture, {
				filename: 'user_picture.jpeg',
				description: 'A fake picture for root',
				mimetype: 'image/jpeg',
				path: join(process.cwd(), './tests/files/user_picture.jpeg'),
				picture_user: em.getReference(User, 4),
				size: 0,
				visibility: visibility_group,
			});

			await em.persistAndFlush(picture);
		});

		afterAll(async () => {
			// Delete the fake picture
			await em.removeAndFlush(picture);
		});

		describe('400 : Bad Request', () => {
			it('when the promotion number is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/invalid/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid(User, 'invalid'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/users/1/picture').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/picture')
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
				const response = await request(app.getHttpServer())
					.get('/users/999/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound(User, 999),
				});
			});

			it('when the user does not have a picture', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.User.NoPicture(1),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user has a picture and the request user has ROOT permissions', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/4/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});

			it('when the user has a picture and the request user is the owner', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/4/picture')
					.set('Authorization', `Bearer ${tokenLogs}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});

			it('when the user has a picture and the request user have the visibility group', async () => {
				const response = await request(app.getHttpServer())
					.get('/users/4/picture')
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});
		});
	});
});
