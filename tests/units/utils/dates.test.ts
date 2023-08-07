import { checkBirthday } from '@utils/dates';

describe('checkBirthday()', () => {
	it('should return true if the date is more than 13 years old', () => {
		expect(checkBirthday('2000-01-01')).toBe(true);
		expect(checkBirthday(new Date('2000-01-01'))).toBe(true);
	});

	it('should return false if the date is less than 13 years old', () => {
		const d = `${new Date().getFullYear()}-01-01`;

		expect(checkBirthday(d)).toBe(false);
		expect(checkBirthday(new Date(d))).toBe(false);
	});

	it('should return false if the date is in the future', () => {
		expect(checkBirthday('3000-01-01')).toBe(false);
	});
});
