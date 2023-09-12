import { existsSync } from 'fs';
import { join } from 'path';

import request from 'supertest';

import { TokenDTO } from '@modules/auth/dto/token.dto';
import { PromotionPicture } from '@modules/promotions/entities/promotion-picture.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';

import { app, config, t, orm } from '..';

describe('Promotions (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenPromotionModerator: string;

	beforeAll(async () => {
		type res = Omit<request.Response, 'body'> & { body: TokenDTO };

		const resA: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: res = await request(app.getHttpServer()).post('/auth/login').send({
			email: 'promos@email.com',
			password: 'root',
		});

		tokenPromotionModerator = resB.body.token;
	});

	describe('(GET) /promotions', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/promotions');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is authorized and return all existing promotions', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				// Expect that all elements in the array have the same type
				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toBeGreaterThan(0);
				expect(body.haveEqualObjects()).toBe(true);

				expect(body[0]).toEqual({
					id: 1,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: 1,
					picture: null,
					users: 0,
				});
			});
		});
	});

	describe('(GET) /promotions/current', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/promotions/current');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/current')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is authorized, return the current promotions', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/current')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				const body = response.body as Array<unknown>;

				expect(body).toBeInstanceOf(Array);
				expect(body.length).toEqual(5);
				expect(body.haveEqualObjects()).toBe(true);

				expect(body[0]).toEqual({
					id: expect.any(Number),
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: expect.any(Number),
					picture: null,
					users: expect.any(Number),
				});
			});
		});
	});

	describe('(GET) /promotions/latest', () => {
		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/promotions/latest');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/latest')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the user is authorized, return the latest promotion', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/latest')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					id: expect.any(Number),
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: expect.any(Number),
					picture: null,
					users: expect.any(Number),
				});
			});
		});
	});

	describe('(GET) /promotions/:number', () => {
		describe('400 : Bad Request', () => {
			it('when the promotion number is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/invalid')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					statusCode: 400,
					error: 'Bad Request',
					message: {
						_errors: ['Expected number, received nan'],
					},
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/promotions/21');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/21')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the promotion does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/999999')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound('Promotion', 999999),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the promotion exists and return it', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/21')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					id: 21,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: 21,
					picture: null,
					users: 1,
				});
			});
		});
	});

	describe('(GET) /promotions/:number/users', () => {
		describe('400 : Bad Request', () => {
			it('when the promotion number is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/invalid/users')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					statusCode: 400,
					error: 'Bad Request',
					message: {
						_errors: ['Expected number, received nan'],
					},
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/promotions/21/users');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/21/users')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the promotion does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/999999/users')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound(Promotion, 999999),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the promotion exists and return users', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/21/users')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual([
					{
						id: 1,
						created_at: expect.any(String),
						updated_at: expect.any(String),
						first_name: 'root',
						last_name: 'root',
						nickname: 'noot noot',
					},
				]);
			});
		});
	});

	describe('(GET) /promotions/:id/logo', () => {
		describe('400 : Bad Request', () => {
			it('when the promotion number is invalid', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/invalid/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					statusCode: 400,
					error: 'Bad Request',
					message: {
						_errors: ['Expected number, received nan'],
					},
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).get('/promotions/21/logo');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the promotion does not exist', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/999999/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound(Promotion, 999999),
				});
			});

			it('when the promotion does not have a logo', async () => {
				const response = await request(app.getHttpServer())
					.get('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Promotion.LogoNotFound(21),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the promotion exists and return the logo', async () => {
				// Set a fake logo
				const logo = orm.em.create(PromotionPicture, {
					filename: '21.webp',
					mimetype: 'image/webp',
					path: join(process.cwd(), './tests/files/promo_21.png'),
					picture_promotion: 21,
					description: 'Promotion logo of the promotion 21',
					size: 0,
				});

				await orm.em.persistAndFlush(logo);
				// ------------------------------

				const response = await request(app.getHttpServer())
					.get('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toBeDefined();
				expect(response.body).toBeInstanceOf(Buffer);

				// Delete the fake logo
				await orm.em.removeAndFlush(logo);
				// ------------------------------
			});
		});
	});

	describe('(POST) /promotions/:id/logo', () => {
		describe('400 : Bad Request', () => {
			it('when no file is attached', async () => {
				const response = await request(app.getHttpServer())
					.post('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Bad Request',
					message: t.Errors.File.NotProvided(),
					statusCode: 400,
				});
			});

			it('when the file is not an image', async () => {
				const response = await request(app.getHttpServer())
					.post('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`)
					.attach('file', './tests/files/text_file.txt');

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.File.InvalidMimeType(['image/*']),
				});
			});

			it('when the file is not 1:1 ratio', async () => {
				const response = await request(app.getHttpServer())
					.post('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`)
					.attach('file', './tests/files/promo_21_not_square.png');

				expect(response.body).toEqual({
					error: 'Bad Request',
					statusCode: 400,
					message: t.Errors.Image.InvalidAspectRatio('1:1'),
				});
			});

			it('when the promotion number is invalid', async () => {
				const response = await request(app.getHttpServer())
					.post('/promotions/invalid/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`)
					.attach('file', `./tests/files/promo_21.png`);

				expect(response.body).toEqual({
					statusCode: 400,
					error: 'Bad Request',
					message: {
						_errors: ['Expected number, received nan'],
					},
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).post('/promotions/21/logo');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.post('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the promotion does not exist', async () => {
				const response = await request(app.getHttpServer())
					.post('/promotions/999999/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`)
					.attach('file', `./tests/files/promo_21.png`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound(Promotion, 999999),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the promotion exists and set the logo', async () => {
				// * Note: The logo is deleted in 'when the promotion exists and delete the logo' * //

				const response = await request(app.getHttpServer())
					.post('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`)
					.attach('file', `./tests/files/promo_21.png`);

				// expect registered data to be returned
				expect(response.body).toEqual({
					id: 21,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: 21,
					picture: {
						id: expect.any(Number),
						created_at: expect.any(String),
						updated_at: expect.any(String),
						filename: expect.any(String),
						description: 'Promotion logo of the promotion 21',
						mimetype: 'image/webp',
						size: 117280,
						is_public: true,
						is_hidden: false,
					},
				});

				// expect the file to be created on disk
				expect(
					existsSync(
						join(config.get<string>('files.promotions'), 'logo', (response.body as Promotion).picture.filename),
					),
				).toBe(true);
			});

			it('when the promotion has a logo and update the logo', async () => {
				// * Note: The logo is deleted in 'when the promotion exists and delete the logo' * //

				// Get the old logo
				const oldLogo = await orm.em.findOne(PromotionPicture, { picture_promotion: 21 });

				const response = await request(app.getHttpServer())
					.post('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`)
					.attach('file', `./tests/files/promo_21.png`);

				// expect registered data to be returned
				expect(response.body).toEqual({
					id: 21,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: 21,
					picture: {
						id: expect.any(Number),
						created_at: expect.any(String),
						updated_at: expect.any(String),
						filename: expect.any(String),
						description: 'Promotion logo of the promotion 21',
						mimetype: 'image/webp',
						size: 117280,
						visibility: null,
						is_public: true,
						is_hidden: false,
					},
				});

				// expect the old file to be deleted from disk
				expect(existsSync(join(config.get<string>('files.promotions'), 'logo', oldLogo.filename))).toBe(false);

				// expect the new file to be created on disk
				expect(
					existsSync(
						join(config.get<string>('files.promotions'), 'logo', (response.body as Promotion).picture.filename),
					),
				).toBe(true);
			});
		});
	});

	describe('(DELETE) /promotions/:id/logo', () => {
		describe('400 : Bad Request', () => {
			it('when the promotion number is invalid', async () => {
				const response = await request(app.getHttpServer())
					.delete('/promotions/invalid/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					statusCode: 400,
					error: 'Bad Request',
					message: {
						_errors: ['Expected number, received nan'],
					},
				});
			});
		});

		describe('401 : Unauthorized', () => {
			it('when the user is not authenticated', async () => {
				const response = await request(app.getHttpServer()).delete('/promotions/21/logo');

				expect(response.body).toEqual({
					statusCode: 401,
					message: 'Unauthorized',
				});
			});
		});

		describe('403 : Forbidden', () => {
			it('when the user is not authorized', async () => {
				const response = await request(app.getHttpServer())
					.delete('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenUnauthorized}`);

				expect(response.body).toEqual({
					error: 'Forbidden',
					statusCode: 403,
					message: 'Forbidden resource',
				});
			});
		});

		describe('404 : Not Found', () => {
			it('when the promotion does not exist', async () => {
				const response = await request(app.getHttpServer())
					.delete('/promotions/999999/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Id.NotFound(Promotion, 999999),
				});
			});

			it('when the promotion does not have a logo', async () => {
				const response = await request(app.getHttpServer())
					.delete('/promotions/20/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					error: 'Not Found',
					statusCode: 404,
					message: t.Errors.Promotion.LogoNotFound(20),
				});
			});
		});

		describe('200 : Ok', () => {
			it('when the promotion exists and delete the logo', async () => {
				// Get the logo filename
				const logo = await orm.em.findOne(PromotionPicture, { picture_promotion: 21 });

				const response = await request(app.getHttpServer())
					.delete('/promotions/21/logo')
					.set('Authorization', `Bearer ${tokenPromotionModerator}`);

				expect(response.body).toEqual({
					id: 21,
					created_at: expect.any(String),
					updated_at: expect.any(String),
					number: 21,
					picture: undefined,
				});

				// expect the file to be deleted from disk
				expect(existsSync(join(config.get<string>('files.promotions'), 'logo', logo.filename))).toBe(false);
			});
		});
	});
});
