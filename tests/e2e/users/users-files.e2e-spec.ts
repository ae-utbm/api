import { copyFileSync, existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

import request from 'supertest';

import { OutputTokenDTO } from '@modules/auth/dto/output.dto';
import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { i18nBadRequestException, i18nNotFoundException, i18nUnauthorizedException } from '@modules/base/http-errors';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { UserBanner } from '@modules/users/entities/user-banner.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';
import { User } from '@modules/users/entities/user.entity';

import { orm, server } from '../..';

describe('Users Files (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenRoot: string;
	let tokenSubscriber: string;
	let tokenLogs: string;
	let idLogs: number;
	let em: typeof orm.em;

	const filePictureSquare = readFileSync(join(process.cwd(), './tests/files/user_picture.jpeg'));
	const fileBanner = readFileSync(join(process.cwd(), './tests/files/user_banner.jpeg'));

	beforeAll(async () => {
		em = orm.em.fork();
		type res = Omit<request.Response, 'body'> & { body: OutputTokenDTO };

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
			email: 'logs@email.com',
			password: 'root',
		});

		tokenLogs = responseD.body.token;
		idLogs = responseD.body.user_id;
	});

	describe('(GET) /users/:id/picture', () => {
		const origin = join(process.cwd(), './tests/files/user_picture.jpeg');
		const copy = join(process.cwd(), './tests/files/user_picture_copy.jpeg');

		beforeAll(() => {
			copyFileSync(origin, copy);
		});

		afterAll(() => {
			if (existsSync(copy)) unlinkSync(copy);
		});

		describe('400 : Bad Request', () => {
			it('when the user id is invalid', async () => {
				const response = await request(server)
					.get('/users/invalid/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'invalid', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/picture').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});

			it('when the user is not in the visibility group of the picture', async () => {
				const visibility_group = await em.findOne(FileVisibilityGroup, { name: 'SUBSCRIBER' });
				const picture = em.create(UserPicture, {
					filename: 'user_picture.jpeg',
					description: 'A fake picture for logs moderator',
					mimetype: 'image/jpeg',
					path: copy,
					picture_user: em.getReference(User, 1),
					size: 0,
					visibility: visibility_group,
				});

				await em.persistAndFlush(picture);

				const response = await request(server)
					.get('/users/1/picture')
					.set('Authorization', `Bearer ${tokenLogs}`)
					.expect(401);

				expect(response.body).toEqual({
					...new i18nUnauthorizedException('validations.user.invalid.not_in_file_visibility_group', {
						group_name: 'SUBSCRIBER',
					}),
				});

				await em.removeAndFlush(picture);
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(server)
					.get('/users/9999/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});

			it('when the user does not have a picture', async () => {
				const response = await request(server)
					.get('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.picture.not_found', { name: 'root root' }),
				});
			});
		});

		describe('200 : Ok', () => {
			let picture: UserPicture;

			beforeAll(async () => {
				// Set a fake picture
				const visibility_group = await em.findOne(FileVisibilityGroup, { name: 'SUBSCRIBER' });
				picture = em.create(UserPicture, {
					filename: 'user_picture.jpeg',
					description: 'A fake picture for logs moderator',
					mimetype: 'image/jpeg',
					path: copy,
					picture_user: em.getReference(User, idLogs),
					size: 0,
					visibility: visibility_group,
				});

				await em.persistAndFlush(picture);
			});

			afterAll(async () => {
				await em.removeAndFlush(picture);
			});

			it('when the user has a picture and the request user has ROOT permissions', async () => {
				const response = await request(server)
					.get(`/users/${idLogs}/picture`)
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});

			it('when the user has a picture and the request user is the owner', async () => {
				const response = await request(server)
					.get(`/users/${idLogs}/picture`)
					.set('Authorization', `Bearer ${tokenLogs}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});

			it('when the user has a picture and the request user is in the visibility group', async () => {
				const response = await request(server)
					.get(`/users/${idLogs}/picture`)
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});
		});
	});

	describe('(POST) /users/:id/picture', () => {
		const origin = join(process.cwd(), './tests/files/user_picture.jpeg');
		const copy = join(process.cwd(), './tests/files/user_picture_copy.jpeg');

		beforeAll(() => {
			copyFileSync(origin, copy);
		});

		afterAll(() => {
			if (existsSync(copy)) unlinkSync(copy);
		});

		describe('400 : Bad Request', () => {
			it('when the user id is invalid', async () => {
				const response = await request(server)
					.post('/users/invalid/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'invalid', property: 'id' }),
				});
			});

			it('when no file is provided', async () => {
				const response = await request(server)
					.post('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.file.invalid.not_provided'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server)
					.post('/users/1/picture')
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});

			it('when the user try to update its picture before the cooldown is passed', async () => {
				// Set a fake picture
				const picture = em.create(UserPicture, {
					filename: 'user_picture.jpeg',
					description: 'A fake picture for root',
					mimetype: 'image/jpeg',
					path: copy,
					picture_user: em.getReference(User, idLogs),
					size: 0,
					visibility: await em.findOneOrFail(FileVisibilityGroup, { name: 'SUBSCRIBER' }),
				});

				await em.persistAndFlush(picture);
				// ---------------------------------------------

				const response = await request(server)
					.post(`/users/${idLogs}/picture`)
					.set('Authorization', `Bearer ${tokenLogs}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(401);

				expect(response.body).toEqual({
					...new i18nUnauthorizedException('validations.user.picture.cooldown', { days: 7 }),
				});

				// Delete the fake picture
				await em.removeAndFlush(picture);
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.post('/users/1/picture')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.attach('file', filePictureSquare, 'file.jpeg')
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
				const response = await request(server)
					.post('/users/9999/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});
		});

		describe('201 : Created', () => {
			it('when the user set its own profile picture', async () => {
				const response = await request(server)
					.post('/users/4/picture')
					.set('Authorization', `Bearer ${tokenLogs}`)
					.attach('file', filePictureSquare, 'file.jpeg');
				// .expect(201);

				expect(response.body).toEqual({
					created: expect.any(String),
					description: 'Picture of logs moderator',
					filename: expect.stringContaining('logs_moderator') as unknown,
					id: expect.any(Number),
					mimetype: 'image/webp',
					size: 3028,
					updated: expect.any(String),
					owner: {
						id: 4,
						kind: 'user',
					},
					visibility_id: 1,
				});

				// Delete the picture
				await em.removeAndFlush(await em.findOne(UserPicture, { picture_user: idLogs }));
			});

			it('when the user can change someone else profile picture', async () => {
				const response = await request(server)
					.post('/users/4/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(201);

				expect(response.body).toEqual({
					created: expect.any(String),
					description: 'Picture of logs moderator',
					filename: expect.stringContaining('logs_moderator') as unknown,
					id: expect.any(Number),
					mimetype: 'image/webp',
					size: 3028,
					updated: expect.any(String),
					owner: {
						id: 4,
						kind: 'user',
					},
					visibility_id: 1,
				});

				// Delete the picture
				await em.removeAndFlush(await em.findOne(UserPicture, { picture_user: idLogs }));
			});

			it('when the user has the permission to change the picture despite the cooldown', async () => {
				// First picture (set the cooldown)
				await request(server)
					.post('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(201);

				// Second picture (should not throw an error)
				const response = await request(server)
					.post('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(201);

				expect(response.body).toEqual({
					created: expect.any(String),
					description: 'Picture of root root',
					filename: expect.stringContaining('root_root') as unknown,
					id: expect.any(Number),
					mimetype: 'image/webp',
					size: 3028,
					updated: expect.any(String),
					owner: {
						id: 1,
						kind: 'user',
					},
					visibility_id: 1,
				});

				// Delete the picture
				await em.removeAndFlush(await em.findOne(UserPicture, { picture_user: 1 }));
			});
		});
	});

	describe('(DELETE) /users/:id/picture', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is invalid', async () => {
				const response = await request(server)
					.delete('/users/invalid/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'invalid', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).delete('/users/1/picture').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.delete('/users/1/picture')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.expect(403);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});

			it('when the user does not have the permission to delete his picture', async () => {
				const response = await request(server)
					.delete(`/users/${idLogs}/picture`)
					.set('Authorization', `Bearer ${tokenLogs}`)
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
				const response = await request(server)
					.delete('/users/9999/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 9999 }),
				});
			});

			it('when the user has no picture', async () => {
				const response = await request(server)
					.delete('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.picture.not_found', { name: 'root root' }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user has the permission to delete the picture', async () => {
				// Set a fake picture to be deleted
				await request(server)
					.post('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', filePictureSquare, 'file.jpeg')
					.expect(201);
				// ---------------------------------------------

				const response = await request(server)
					.delete('/users/1/picture')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toEqual({
					...new OutputMessageDTO('validations.user.success.deleted_picture', { name: 'root root' }),
				});
			});
		});
	});

	describe('(GET) /users/:id/banner', () => {
		const origin = join(process.cwd(), './tests/files/user_banner.jpeg');
		const copy = join(process.cwd(), './tests/files/user_banner_copy.jpeg');

		beforeAll(() => {
			copyFileSync(origin, copy);
		});

		afterAll(() => {
			if (existsSync(copy)) unlinkSync(copy);
		});

		describe('400 : Bad Request', () => {
			it('when the user id is invalid', async () => {
				const response = await request(server)
					.get('/users/invalid/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'invalid', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).get('/users/1/banner').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the user does not exist', async () => {
				const response = await request(server)
					.get('/users/999/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 999 }),
				});
			});

			it('when the user does not have a banner', async () => {
				const response = await request(server)
					.get('/users/1/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.banner.not_found', { name: 'root root' }),
				});
			});
		});

		describe('200 : Ok', () => {
			let banner: UserBanner;

			beforeAll(async () => {
				// Set a fake banner
				const visibility_group = await em.findOne(FileVisibilityGroup, { name: 'SUBSCRIBER' });
				banner = em.create(UserBanner, {
					filename: 'user_banner.jpeg',
					description: 'A fake banner for logs moderator',
					mimetype: 'image/jpeg',
					path: copy,
					banner_user: em.getReference(User, idLogs),
					size: 0,
					visibility: visibility_group,
				});

				await em.persistAndFlush(banner);
			});

			afterAll(async () => {
				// Delete the fake banner
				await em.removeAndFlush(banner);
			});

			it('when the user has a banner and the request user has ROOT permissions', async () => {
				const response = await request(server)
					.get(`/users/${idLogs}/banner`)
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});

			it('when the user has a banner and the request user is the owner', async () => {
				const response = await request(server)
					.get(`/users/${idLogs}/banner`)
					.set('Authorization', `Bearer ${tokenLogs}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});

			it('when the user has a banner and the request user is in the visibility group', async () => {
				const response = await request(server)
					.get(`/users/${idLogs}/banner`)
					.set('Authorization', `Bearer ${tokenSubscriber}`)
					.expect(200);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);
			});
		});
	});

	describe('(POST) /users/:id/banner', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is invalid', async () => {
				const response = await request(server)
					.post('/users/invalid/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'invalid', property: 'id' }),
				});
			});

			it('when no file is provided', async () => {
				const response = await request(server)
					.post('/users/1/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.file.invalid.not_provided'),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server)
					.post('/users/1/banner')
					.attach('file', fileBanner, 'file.jpeg')
					.expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.post('/users/1/banner')
					.set('Authorization', `Bearer ${tokenUnauthorized}`)
					.attach('file', fileBanner, 'file.jpeg')
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
				const response = await request(server)
					.post('/users/999/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 999 }),
				});
			});
		});

		describe('201 : Created', () => {
			it('when the user set its own banner', async () => {
				const response = await request(server)
					.post('/users/4/banner')
					.set('Authorization', `Bearer ${tokenLogs}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(201);

				expect(response.body).toEqual({
					created: expect.any(String),
					description: 'Banner of logs moderator',
					filename: expect.stringContaining('logs_moderator') as unknown,
					id: expect.any(Number),
					mimetype: 'image/webp',
					size: 9498,
					updated: expect.any(String),
					owner: {
						id: 4,
						kind: 'user',
					},
					visibility_id: 1,
				});

				// Delete the banner
				await em.removeAndFlush(await em.findOne(UserBanner, { banner_user: 4 }));
			});

			it('when the user update its own banner', async () => {
				// Set the first banner
				await request(server)
					.post('/users/4/banner')
					.set('Authorization', `Bearer ${tokenLogs}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(201);

				// Set the second banner
				const response = await request(server)
					.post('/users/4/banner')
					.set('Authorization', `Bearer ${tokenLogs}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(201);

				expect(response.body).toEqual({
					created: expect.any(String),
					description: 'Banner of logs moderator',
					filename: expect.stringContaining('logs_moderator') as unknown,
					id: expect.any(Number),
					mimetype: 'image/webp',
					size: 9498,
					updated: expect.any(String),
					owner: {
						id: 4,
						kind: 'user',
					},
					visibility_id: 1,
				});

				// Delete the banner
				await em.removeAndFlush(await em.findOne(UserBanner, { banner_user: 4 }));
			});

			it('when the user can change someone else banner', async () => {
				const response = await request(server)
					.post('/users/1/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(201);

				expect(response.body).toEqual({
					created: expect.any(String),
					description: 'Banner of root root',
					filename: expect.stringContaining('root_root') as unknown,
					id: expect.any(Number),
					mimetype: 'image/webp',
					size: 9498,
					updated: expect.any(String),
					owner: {
						id: 1,
						kind: 'user',
					},
					visibility_id: 1,
				});

				// Delete the banner
				await em.removeAndFlush(await em.findOne(UserBanner, { banner_user: 1 }));
			});
		});
	});

	describe('(DELETE) /users/:id/banner', () => {
		describe('400 : Bad Request', () => {
			it('when the user id is invalid', async () => {
				const response = await request(server)
					.delete('/users/invalid/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(400);

				expect(response.body).toEqual({
					...new i18nBadRequestException('validations.id.invalid.format', { value: 'invalid', property: 'id' }),
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(server).delete('/users/1/banner').expect(401);

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(server)
					.delete('/users/1/banner')
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
				const response = await request(server)
					.delete('/users/999/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.not_found.id', { id: 999 }),
				});
			});

			it('when the user has no banner', async () => {
				const response = await request(server)
					.delete('/users/1/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(404);

				expect(response.body).toEqual({
					...new i18nNotFoundException('validations.user.banner.not_found', { name: 'root root' }),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user has the permission to delete the banner', async () => {
				// Set a fake banner to be deleted
				await request(server)
					.post('/users/1/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.attach('file', fileBanner, 'file.jpeg')
					.expect(201);
				// ---------------------------------------------

				const response = await request(server)
					.delete('/users/1/banner')
					.set('Authorization', `Bearer ${tokenRoot}`)
					.expect(200);

				expect(response.body).toEqual({
					...new OutputMessageDTO('validations.user.success.deleted_banner', { name: 'root root' }),
				});
			});
		});
	});
});
