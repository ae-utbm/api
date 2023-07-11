/**
 * Generates a random password of the given length.
 * @param {number} length the length of the password to generate
 * @returns {string} the generated password
 */
export function generateRandomPassword(length: number): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
	let password = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		password += chars[randomIndex];
	}

	return password;
}
