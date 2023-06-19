import type { email } from '@types';
import env from '@env';

/**
 * Check if an email is allowed to be used (to register for example)
 * @param {email} email the email to check
 * @returns {boolean} true if the email is allowed, false otherwise
 */
export function checkEmail(email: email): boolean {
	const blacklist = env().email.blacklist.host;
	const whitelisted = env().email.whitelist.email;

	if (whitelisted.includes(email)) return true;
	else if (blacklist.some((host) => email.endsWith(host))) return false;

	return true;
}
