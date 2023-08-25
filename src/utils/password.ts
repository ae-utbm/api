import * as crypto from 'crypto';

const SPECIAL_CHARS = '!@#$%^&*()';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} max @default 100
 * @param {number} min @default 0
 * @returns {number} the generated random integer
 */
export function secureRandomInt(max: number = 100, min: number = 0): number {
	const range = max - min + 1;
	const bitsNeeded = Math.ceil(Math.log2(range));
	const bytesNeeded = Math.ceil(bitsNeeded / 8);
	const randomBytes = crypto.randomBytes(bytesNeeded);
	const randomValue = randomBytes.readUIntLE(0, bytesNeeded);

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
		SPECIAL_CHARS[secureRandomInt(SPECIAL_CHARS.length - 1)],
		LOWERCASE_CHARS[secureRandomInt(LOWERCASE_CHARS.length - 1)],
		UPPERCASE_CHARS[secureRandomInt(UPPERCASE_CHARS.length - 1)],
		NUMBERS[secureRandomInt(NUMBERS.length - 1)],
	];

	const remainingLength = length - 4;

	for (let i = 0; i < remainingLength; i++) {
		const charSet = SPECIAL_CHARS + LOWERCASE_CHARS + UPPERCASE_CHARS + NUMBERS;
		const randomIndex = Math.floor(Math.random() * charSet.length);
		password.push(charSet[randomIndex]);
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
