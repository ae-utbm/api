import request from 'supertest';
import { app, i18n } from '../setupFilesAfterEnv';
import { idInvalid, idNotFound } from '@utils/responses';
import { User } from '@modules/users/entities/user.entity';

describe('LogsController (e2e)', () => {
	let tokenUnverified: string;
	let userIdUnverified: number;

	let tokenLogModerator: string;
	let userIdLogModerator: number;

	beforeAll(async () => {
		const responseA = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'unverified@email.com',
			password: 'root',
		});

		tokenUnverified = responseA.body.token;
		userIdUnverified = responseA.body.user_id;

		const responseB = await request(app.getHttpServer()).post('/api/auth/login').send({
			email: 'logs@email.com',
			password: 'root',
		});

		tokenLogModerator = responseB.body.token;
		userIdLogModerator = responseB.body.user_id;
	});

	describe('/api/logs/user/{user_id} (GET)', () => {
		it('should return 401 when the user is not authenticated', async () => {
			const response = await request(app.getHttpServer()).get('/api/logs/user/1').expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 401 when the user is not the same as the user ID in the request', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/logs/user/1')
				.set('Authorization', `Bearer ${tokenUnverified}`)
				.expect(401);

			expect(response.body).toEqual({
				statusCode: 401,
				message: 'Unauthorized',
			});
		});

		it('should return 404 when the user does not exist', async () => {
			const fakeId = 9999;

			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(404);

			expect(response.body).toEqual({
				error: 'Not Found',
				statusCode: 404,
				message: idNotFound({ i18n, type: User, id: fakeId }),
			});
		});

		it('should return 400 when the user ID is invalid', async () => {
			const fakeId = 'invalid';

			const response = await request(app.getHttpServer())
				.get(`/api/logs/user/${fakeId}`)
				.set('Authorization', `Bearer ${tokenLogModerator}`)
				.expect(400);

			expect(response.body).toEqual({
				error: 'Bad Request',
				statusCode: 400,
				message: idInvalid({ i18n, type: User, id: fakeId }),
			});
		});
	});

	describe('/api/logs/{user} (DELETE)', () => {
		// it();
	});
});
