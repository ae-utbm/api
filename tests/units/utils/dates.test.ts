import { checkBirthDate } from '@utils/dates';

describe('checkBirthDate()', () => {
	it('should return true if the date is more than 13 years old', () => {
		expect(checkBirthDate('2000-01-01')).toBe(true);
		expect(checkBirthDate(new Date('2000-01-01'))).toBe(true);
	});

	it('should return false if the date is less than 13 years old', () => {
		const d = `${new Date().getFullYear()}-01-01`;

		expect(checkBirthDate(d)).toBe(false);
		expect(checkBirthDate(new Date(d))).toBe(false);
	});

	it('should return false if the date is in the future', () => {
		expect(checkBirthDate('3000-01-01')).toBe(false);
	});
});
