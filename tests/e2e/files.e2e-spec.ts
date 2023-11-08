import request from 'supertest';

import { TokenDTO } from '@modules/auth/dto/token.dto';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { File } from '@modules/files/entities/file.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';

import { orm, server, t } from '..';

describe('Files (e2e)', () => {
	let em: typeof orm.em;
	let file: File<unknown>;

	let tokenVerified: string;

	let tokenSubscriber: string;
	let userIdSubscriber: number;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: TokenDTO };

		em = orm.em.fork();

		const responseA: res = await request(server).post('/auth/login').send({
			email: 'promos@email.com',
			password: 'root',
		});

		tokenVerified = responseA.body.token;

		const responseB: res = await request(server).post('/auth/login').send({
			email: 'subscriber@email.com',
			password: 'root',
		});

		tokenSubscriber = responseB.body.token;
		userIdSubscriber = responseB.body.user_id;

		const visibility = await em.findOne(FileVisibilityGroup, { name: 'SUBSCRIBER' });
		file = em.create(UserPicture, {
			filename: 'test.png',
			mimetype: 'image/png',
			path: 'test.png',
			size: 123,
			visibility,
			description: 'foo bar',
			picture_user: userIdSubscriber,
		});

		await em.persistAndFlush(file);
	});

	afterAll(async () => {
		await em.removeAndFlush(file);
	});

	describe('(GET) /files/:id/data', () => {
		describe('400 : Bad Request', () => {
			it('when id is not valid', async () => {
				const res = await request(server)
					.get(`/files/invalid/data`)
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(400);

				expect(res.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Id.Invalid('File', 'invalid'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when user is not logged in', async () => {
				const res = await request(server).get(`/files/${file.id}/data`).expect(401);

				expect(res.body).toEqual({
					message: 'Unauthorized',
					statusCode: 401,
				});
			});

			it('when user is not in the visibility group', async () => {
				const res = await request(server)
					.get(`/files/${file.id}/data`)
					.set('Authorization', `Bearer ${tokenVerified}`)
					.expect(401);

				expect(res.body).toEqual({
					error: 'Unauthorized',
					message: t.Errors.File.Unauthorized(file.visibility?.name),
					statusCode: 401,
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when file is not found', async () => {
				const res = await request(server)
					.get(`/files/9999/data`)
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(404);

				expect(res.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound('File', 9999),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when file is found', async () => {
				const res = await request(server)
					.get(`/files/${file.id}/data`)
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(200);

				expect(res.body).toEqual({
					id: file.id,
					filename: 'test.png',
					mimetype: 'image/png',
					size: 123,
					visibility: file.visibility.id,
					description: 'foo bar',
					picture_user: userIdSubscriber,
					created: expect.any(String),
					updated: expect.any(String),
				});
			});
		});
	});
});
