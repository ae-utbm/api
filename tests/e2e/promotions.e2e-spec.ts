import { existsSync } from 'fs';
import { join } from 'path';

import request from 'supertest';

import { TokenDTO } from '@modules/auth/dto/token.dto';
import { PromotionPicture } from '@modules/promotions/entities/promotion-picture.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { idNotFound, imageInvalidAspectRatio, imageInvalidMimeType, promotionLogoNotFound } from '@utils/responses';

import { app, config, i18n, orm } from '..';

describe('PromotionsController (e2e)', () => {
	let tokenUnauthorized: string;
	let tokenPromotionModerator: string;

	beforeAll(async () => {
		type Res = Omit<request.Response, 'body'> & { body: TokenDTO };

		const resA: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'unauthorized@email.com',
			password: 'root',
		});

		tokenUnauthorized = resA.body.token;

		const resB: Res = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'promos@email.com',
			password: 'root',
		});

		tokenPromotionModerator = resB.body.token;
	});

	describe('/api/promotions (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/promotions');

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions')
				.set('Authorization', `Bearer ${tokenUnauthorized}`);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 200 when the user is authorized and return all existing promotions', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			// Expect that all elements in the array have the same type
			const body = response.body as Array<unknown>;

			expect(body).toBeInstanceOf(Array);
			expect(body.length).toBeGreaterThan(0);
			expect(body.haveEqualObjects()).toBe(true);

			expect(body[0]).toEqual({
				id: 1,
				created_at: expect.any(String) as string,
				updated_at: expect.any(String) as string,
				number: 1,
				picture: null,
				users: 0,
			});
		});
	});

	describe('/api/promotions/:id (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/promotions/21');

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/21')
				.set('Authorization', `Bearer ${tokenUnauthorized}`);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the promotion does not exist', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/999999')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ id: 999999, type: Promotion, i18n }),
			});
		});

		it('should return 200 when the promotion exists and return it', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/21')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				id: 21,
				created_at: expect.any(String) as string,
				updated_at: expect.any(String) as string,
				number: 21,
				picture: null,
				users: 1,
			});
		});
	});

	describe('/api/promotions/:id/users (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/promotions/21/users');

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/21/users')
				.set('Authorization', `Bearer ${tokenUnauthorized}`);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the promotion does not exist', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/999999/users')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ id: 999999, type: Promotion, i18n }),
			});
		});

		it('should return 200 when the promotion exists and return users', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/21/users')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual([
				{
					id: 1,
					created_at: expect.any(String) as string,
					updated_at: expect.any(String) as string,
					first_name: 'root',
					last_name: 'root',
					nickname: 'noot noot',
				},
			]);
		});
	});

	describe('/api/promotions/:id/logo (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/promotions/21/logo');

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenUnauthorized}`);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the promotion does not exist', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/999999/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ id: 999999, type: Promotion, i18n }),
			});
		});

		it('should return 404 when the promotion does not have a logo', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: promotionLogoNotFound({ number: 21, i18n }),
			});
		});

		it('should return 200 when the promotion exists and return the logo', async () => {
			// Set a fake logo
			const logo = orm.em.create(PromotionPicture, {
				filename: '21.webp',
				mimetype: 'image/webp',
				path: join(process.cwd(), './tests/files/promo_21.webp'),
				promotion: 21,
				size: 0,
				visibility: 'public',
			});

			await orm.em.persistAndFlush(logo);
			// ------------------------------

			const response = await request(app.getHttpServer())
				.get('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toBeDefined();
			expect(response.body).toBeInstanceOf(Buffer);

			// Delete the fake logo
			await orm.em.removeAndFlush(logo);
			// ------------------------------
		});
	});

	describe('/api/promotions/:id/logo (POST)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).post('/api/promotions/21/logo');

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenUnauthorized}`);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the promotion does not exist', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/promotions/999999/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ id: 999999, type: Promotion, i18n }),
			});
		});

		it('should return 400 when the file is not an image', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`)
				.attach('file', './tests/files/text_file.txt');

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: imageInvalidMimeType({ i18n }),
			});
		});

		it('should return 400 when the file is not 1:1 ratio', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`)
				.attach('file', './tests/files/promo_21_not_square.png');

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: imageInvalidAspectRatio({ i18n, aspect_ratio: '1:1' }),
			});
		});

		it('should return 200 when the promotion exists and set the logo', async () => {
			// * Note: The logo is deleted in 'should return 200 when the promotion exists and delete the logo' * //

			const response = await request(app.getHttpServer())
				.post('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`)
				.attach('file', `./tests/files/promo_21.webp`);

			// expect registered data to be returned
			expect(response.body).toEqual({
				id: 21,
				created_at: expect.any(String) as string,
				updated_at: expect.any(String) as string,
				number: 21,
				picture: {
					id: expect.any(Number) as number,
					created_at: expect.any(String) as string,
					updated_at: expect.any(String) as string,
					filename: '21.webp',
					mimetype: 'image/webp',
					size: 117280,
					visibility: 'public',
				},
			});

			// expect the file to be created on disk
			expect(existsSync(join(config.get<string>('files.promotions'), 'logo', '21.webp'))).toBe(true);
		});
	});

	describe('/api/promotions/:id/logo (DELETE)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).delete('/api/promotions/21/logo');

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 403 when the user is not authorized', async () => {
			const response = await request(app.getHttpServer())
				.delete('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenUnauthorized}`);

			expect(response.body).toEqual({
				error: 'Forbidden',
				statusCode: 403,
				message: 'Forbidden resource', // TODO translate this
			});
		});

		it('should return 404 when the promotion does not exist', async () => {
			const response = await request(app.getHttpServer())
				.delete('/api/promotions/999999/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ id: 999999, type: Promotion, i18n }),
			});
		});

		it('should return 404 when the promotion does not have a logo', async () => {
			const response = await request(app.getHttpServer())
				.delete('/api/promotions/20/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: promotionLogoNotFound({ number: 20, i18n }),
			});
		});

		it('should return 200 when the promotion exists and delete the logo', async () => {
			const response = await request(app.getHttpServer())
				.delete('/api/promotions/21/logo')
				.set('Authorization', `Bearer ${tokenPromotionModerator}`);

			expect(response.body).toEqual({
				id: 21,
				created_at: expect.any(String) as string,
				updated_at: expect.any(String) as string,
				number: 21,
				picture: undefined,
			});

			// expect the file to be deleted from disk
			// * This would fail on Windows, as Node does not allow to delete a file that is in use (by itself)
			if (process.platform !== 'win32')
				expect(existsSync(join(config.get<string>('files.promotions'), 'logo', '21.webp'))).toBe(false);
		});
	});
});
