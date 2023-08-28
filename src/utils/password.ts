import * as crypto from 'crypto';

const SPECIAL_CHARS = '!@#$%^&*()';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Safely generates a random integer between the given range.
 * @param {number} max @default 12
 * @param {number} min @default 0
 * @returns {number} the generated integer
 */
export function randomInt(max: number = 12, min: number = 0): number {
	if (max === min) return min;
	if (max < min) [max, min] = [min, max];

	const range = max - min;
	const bytesNeeded = Math.ceil(Math.log2(range) / 8);

	if (bytesNeeded === 0) {
		return min; // Range is just a single number
	}

	const randomBytes = crypto.randomBytes(bytesNeeded);
	const randomValue = randomBytes.readUIntBE(0, bytesNeeded);

	return min + (randomValue % range);
}

/**
 * Generates a random password of the given length.
 * @param {number} length the length of the password to generate
 * @returns {string} the generated password
 */
export function generateRandomPassword(length: number = MINIMUM_PASSWORD_LENGTH): string {
	if (length < MINIMUM_PASSWORD_LENGTH) length = MINIMUM_PASSWORD_LENGTH;

	const password = [
		SPECIAL_CHARS[randomInt(SPECIAL_CHARS.length - 1)],
		LOWERCASE_CHARS[randomInt(LOWERCASE_CHARS.length - 1)],
		UPPERCASE_CHARS[randomInt(UPPERCASE_CHARS.length - 1)],
		NUMBERS[randomInt(NUMBERS.length - 1)],
	].shuffle();

	const remainingLength = length - password.length;

	for (let i = 0; i < remainingLength; i++) {
		const charSet = SPECIAL_CHARS + LOWERCASE_CHARS + UPPERCASE_CHARS + NUMBERS;
		password.push(charSet[randomInt(charSet.length)]);
	}

	return password.join('');
}

/**
 * Check if the password is strong enough
 * @param {string} password the password to check
 * @returns {boolean} true if the password is strong enough, false otherwise
 */
export function checkPasswordStrength(password: string): boolean {
	const regex = new RegExp(
		`^(?=.*[${LOWERCASE_CHARS}])(?=.*[${UPPERCASE_CHARS}])(?=.*[${NUMBERS}])(?=.*[${SPECIAL_CHARS}]).{${MINIMUM_PASSWORD_LENGTH},}$`,
	);
	return regex.test(password);
}
