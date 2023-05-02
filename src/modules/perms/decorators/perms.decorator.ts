import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS = [
	{
		name: 'ROOT',
		description: 'Can do anything',
	},
	{
		name: 'CAN_MANAGE_USERS',
		description: 'Can manage users',
	},
	{
		name: 'CAN_READ_USERS',
		description: 'Can read users data',
	},
	{
		name: 'CAN_MANAGE_USER_PERMISSIONS',
		description: 'Can manage user permissions',
	},
	{
		name: 'CAN_READ_USER_PERMISSIONS',
		description: 'Can read what permissions a user has',
	},
] as const;

export type TPermission = (typeof PERMISSIONS)[number]['name'];

/**
 * Set up what permissions are required to access the decorated route
 * @param {...TPermission} permissions - list of permissions required to access the route
 */
export const Permissions = (...permissions: Array<TPermission>) => SetMetadata('permissions', permissions);
