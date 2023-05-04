/**
 * This file contains all the permissions available in the API.
 *! Please note that permissions are not stored in the database, they are hardcoded.
 */
export const PERMISSIONS = [
	{
		name: 'ROOT',
		description: 'As access to everything',
	},

	// PERMISSIONS
	{
		name: 'CAN_EDIT_PERMISSIONS_OF_USER',
		description: 'Can assign/remove permissions of a user',
	},
	{
		name: 'CAN_EDIT_PERMISSIONS_OF_ROLE',
		description: 'Can assign/remove permissions of an existing role',
	},
	{
		name: 'CAN_READ_PERMISSIONS_OF_USER',
		description: 'Can read permissions of a user',
	},
	{
		name: 'CAN_READ_PERMISSIONS_OF_ROLE',
		description: 'Can read permissions of a role',
	},
	{
		name: 'CAN_READ_ALL_PERMISSIONS',
		description: 'Can read all permissions available',
	},

	// ROLES
	{
		name: 'CAN_CREATE_ROLE',
		description: 'Can create a new role',
	},
	{
		name: 'CAN_REVOKE_ROLE',
		description: 'Can revoke a role (making it disabled)',
	},
	{
		name: 'CAN_EDIT_EXPIRATION_OF_ROLE',
		description: 'Can edit the expiration date of a role',
	},
	{
		name: 'CAN_READ_ROLES_OF_USER',
		description: 'Can read roles of a user',
	},
	{
		name: 'CAN_READ_ALL_ROLES',
		description: 'Can read all roles available',
	},

	// USERS
	{
		name: 'CAN_CREATE_USER',
		description: 'Can create a new user',
	},
	{
		name: 'CAN_UPDATE_USER',
		description: 'Can update an existing user',
	},
	{
		name: 'CAN_DELETE_USER',
		description: 'Can delete an existing user',
	},
	{
		name: 'CAN_READ_USER',
		description: 'Can read an existing user',
	},

	// PROMOTIONS
	{
		name: 'CAN_VIEW_USERS_IN_PROMOTION',
		description: 'Can view all users in a promotion',
	},
] as const;
