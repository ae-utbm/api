import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { PromotionsService } from '@modules/promotions/promotions.service';

import { moduleFixture, orm } from '../..';

describe('PromotionsService', () => {
	let promotionsService: PromotionsService;

	beforeAll(() => {
		promotionsService = moduleFixture.get<PromotionsService>(PromotionsService);
	});

	describe('PromotionsService.createNewPromotion()', () => {
		it('Should create a new promotion', async () => {
			const currentLatest = await promotionsService.findLatest();

			await promotionsService.createNewPromotion();

			const newLatest = await promotionsService.findLatest();

			expect(newLatest).toBeDefined();
			expect(newLatest.number).toBe(currentLatest.number + 1);

			// Clean up
			await orm.em.nativeDelete(Promotion, { id: newLatest.id });
			// ------------------------------
		});
	});
});
