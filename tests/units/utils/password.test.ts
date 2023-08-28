import { generateRandomPassword, checkPasswordStrength, randomInt } from '@utils/password';
import '@utils/index';

describe('Password (unit)', () => {
	describe('.generateRandomPassword()', () => {
		it('should generate a random password of the given length', () => {
			// Min length
			expect(generateRandomPassword(5)).toHaveLength(8);
			expect(generateRandomPassword(8)).toHaveLength(8);

			for (let i = 8; i < 64; i++) {
				expect(generateRandomPassword(i)).toHaveLength(i);
			}
		});
	});

	describe('.randomInt()', () => {
		it('should generate a random integer between the given range', () => {
			expect(randomInt(0, 0)).toBe(0);

			for (let i = 0; i < 32; i++) {
				const n = randomInt(32, i);
				expect(n).toBeGreaterThanOrEqual(i);
				expect(n).toBeLessThanOrEqual(32);
			}

			for (let i = 0; i < 32; i++) {
				const n = randomInt();
				expect(n).toBeGreaterThanOrEqual(0);
				expect(n).toBeLessThanOrEqual(12);
			}

			const swapped = randomInt(0, 10);
			expect(swapped).toBeGreaterThanOrEqual(0);
			expect(swapped).toBeLessThanOrEqual(10);
		});
	});

	describe('.checkPasswordStrength()', () => {
		it('should return true if the password is strong enough', () => {
			expect(checkPasswordStrength(generateRandomPassword(5))).toBe(true);
			expect(checkPasswordStrength(generateRandomPassword(8))).toBe(true);

			for (let i = 8; i < 512; i++) {
				expect(checkPasswordStrength(generateRandomPassword(i))).toBe(true);
			}
		});
	});
});
