/**
 * Determines if a date is valid for a user's birth date
 * (must be at least 13 years old and not in the future)
 * @param {string|Date} birth_date The date to check
 * @returns {boolean} True if the date is valid, false otherwise
 */
export function checkBirthDate(birth_date: string | Date): boolean {
	const date = typeof birth_date === 'string' ? new Date(birth_date) : birth_date;
	const now = new Date();

	// Check if the date is in the future
	if (date > now) return false;

	// Check if the user is at least 13 years old
	const diff = now.getFullYear() - date.getFullYear();
	if (diff < 13) return false;

	return true;
}
