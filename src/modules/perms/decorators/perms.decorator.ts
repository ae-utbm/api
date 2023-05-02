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
		name: 'CAN_UPDATE_USERS',
		description: 'Can update users data',
	},
	{
		name: 'CAN_CREATE_USERS',
		description: 'Can create users',
	},
	{
		name: 'CAN_DELETE_USERS',
		description: 'Can delete users',
	},
	{
		name: 'CAN_READ_USERS',
		description: 'Can read users data',
	},
	{
		name: 'CAN_READ_ALL_PERMISSIONS',
		description: 'Can see all available permissions',
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

// do not use this type to define PERMISSIONS, as it would break
// the type safety of the decorator (it would allow to pass any string)
export interface PermissionObject {
	name: Uppercase<string>;
	description: string;
}

export type PermissionName = (typeof PERMISSIONS)[number]['name'];

/**
 * Set up what permissions are required to access the decorated route
 * @param {...PermissionName} permissions - list of permissions required to access the route
 */
export const Permissions = (...permissions: Array<PermissionName>) => SetMetadata('permissions', permissions);
