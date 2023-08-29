import * as crypto from 'crypto';

const SPECIAL_CHARS = '!@#$%^&*()';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Safely generates a random integer between the given range.
 * @param {number} max Maximum value **included** in the range @default 12
 * @param {number} min Minimum value **included** in the range @default 0
 * @returns {number} The generated integer
 */
export function randomInt(max: number = 12, min: number = 0): number {
	if (max === min) return min;
	if (max < min) [max, min] = [min, max];

	const range = max - min + 1;
	const byteCount = Math.ceil(Math.log2(range) / 8); // Number of bytes needed to represent the range

	let randomNumber = 0;
	do {
		const randomBytes = crypto.randomBytes(byteCount);
		randomNumber = randomBytes.readUIntBE(0, byteCount);
	} while (randomNumber >= range);

	return randomNumber + min;
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
		password.push(charSet[randomInt(charSet.length - 1)]);
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
