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
		name: 'CAN_MANAGE_USER_PERMISSIONS',
		description: 'Can manage user permissions',
	},
	{
		name: 'CAN_READ_USERS',
		description: 'Can read users data',
	},
] as const;

export type TPermission = (typeof PERMISSIONS)[number]['name'];
export const Permissions = (...permissions: Array<TPermission>) => SetMetadata('permissions', permissions);
