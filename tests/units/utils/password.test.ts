import { generateRandomPassword, checkPasswordStrength } from '@utils/password';

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
