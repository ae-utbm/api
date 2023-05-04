import { PERMISSIONS } from '@modules/perms/perms';

/**
 * How permissions are registered in the API
 *
 * @warning Do not use this type to define PERMISSIONS, as it would break
 * the type safety of the decorator (it would allow to pass any string)
 */
export interface PermissionObject {
	/**
	 * Name of the permission, in uppercase
	 */
	name: Uppercase<string>;

	/**
	 * Description of the permission
	 */
	description: string;
}

/**
 * List of available permissions throughout the API
 */
export type PermissionName = (typeof PERMISSIONS)[number]['name'];

export interface FileUpload {
	filename: string;
	mimetype: string;
	encoding: string;
	createReadStream: () => NodeJS.ReadableStream;
}
