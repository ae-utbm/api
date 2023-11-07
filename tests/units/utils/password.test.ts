import { generateRandomPassword } from '@modules/_mixin/decorators/is-strong-pass.decorator';

describe('Password (unit)', () => {
	describe('.generateRandomPassword()', () => {
		it('should generate a random password of the given length', () => {
			// Min length
			expect(generateRandomPassword(5)).toHaveLength(8);
			expect(generateRandomPassword(8)).toHaveLength(8);

			for (let i = 8; i < 16; i++) {
				expect(generateRandomPassword(i)).toHaveLength(i);
			}
		});
	});
});
