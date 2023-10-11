import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { PromotionsService } from '@modules/promotions/promotions.service';

import { moduleFixture, orm } from '../..';

describe('PromotionsService (unit)', () => {
	let promotionsService: PromotionsService;
	let em: typeof orm.em;

	beforeAll(() => {
		em = orm.em.fork();
		promotionsService = moduleFixture.get<PromotionsService>(PromotionsService);
	});

	describe('.createNewPromotion()', () => {
		it('should create a new promotion', async () => {
			const currentLatest = await promotionsService.findLatest();

			await promotionsService.createNewPromotion();

			const newLatest = await promotionsService.findLatest();

			expect(newLatest).toBeDefined();
			expect(newLatest.number).toBe(currentLatest.number + 1);

			// Clean up
			await em.nativeDelete(Promotion, { id: newLatest.id });
			// ------------------------------
		});
	});
});
