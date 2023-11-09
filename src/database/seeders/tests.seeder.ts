import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hashSync } from 'bcrypt';

import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { RoleExpiration } from '@modules/roles/entities/role-expiration.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';

import { DatabaseSeeder } from './database.seeder';

/**
 * This class is used to populate the database with some *test* data
 */
export class TestSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
		// Base database seeding
		await this.call(em, [DatabaseSeeder]);

		const users = this.create_users(em);
		const roles = this.create_roles(em);

		const logsUser = users.find((u) => u.email === 'logs@email.com');
		const permUser = users.find((u) => u.email === 'perms@email.com');
		const promosUser = users.find((u) => u.email === 'promos@email.com');
		const rolesUser = users.find((u) => u.email === 'roles@email.com');
		const subscribedUser = users.find((u) => u.email === 'subscriber@email.com');

		// Assign permissions to users
		const perms = [
			em.create(Permission, {
				name: 'CAN_READ_LOGS_OF_USER',
				expires: new Date('9999-12-31'),
				user: logsUser,
			}),

			em.create(Permission, {
				name: 'CAN_DELETE_LOGS_OF_USER',
				expires: new Date('9999-12-31'),
				user: logsUser,
			}),
		];

		// Assign roles to users
		permUser.roles.add(roles.find((r) => r.name === 'PERMISSIONS_MODERATOR'));
		promosUser.roles.add(roles.find((r) => r.name === 'PROMOTIONS_MODERATOR'));
		rolesUser.roles.add(roles.find((r) => r.name === 'ROLES_MODERATOR'));

		const role_expirations = [
			em.create(RoleExpiration, {
				user: permUser,
				role: roles.find((r) => r.name === 'PERMISSIONS_MODERATOR'),
				expires: new Date('9999-12-31'),
			}),
			em.create(RoleExpiration, {
				user: promosUser,
				role: roles.find((r) => r.name === 'PROMOTIONS_MODERATOR'),
				expires: new Date('9999-12-31'),
			}),
			em.create(RoleExpiration, {
				user: rolesUser,
				role: roles.find((r) => r.name === 'ROLES_MODERATOR'),
				expires: new Date('9999-12-31'),
			}),
		];

		// Assign visibility groups to users
		subscribedUser.files_visibility_groups.add(await em.findOne(FileVisibilityGroup, { name: 'SUBSCRIBER' }));

		await em.persistAndFlush([...users, ...perms, ...roles, ...role_expirations]);
	}

	create_roles(em: EntityManager): Role[] {
		const res: Role[] = [];

		const roles: Partial<Role>[] = [
			{
				name: 'PERMISSIONS_MODERATOR',
				permissions: [
					'CAN_READ_PERMISSIONS_OF_USER',
					'CAN_EDIT_PERMISSIONS_OF_USER',
					'CAN_READ_PERMISSIONS_OF_ROLE',
					'CAN_EDIT_PERMISSIONS_OF_ROLE',
				],
			},
			{
				name: 'PROMOTIONS_MODERATOR',
				permissions: ['CAN_READ_PROMOTION', 'CAN_EDIT_PROMOTION'],
			},
			{
				name: 'ROLES_MODERATOR',
				permissions: ['CAN_READ_ROLE', 'CAN_EDIT_ROLE'],
			},
		];

		for (const role of roles) {
			res.push(em.create(Role, role));
		}

		return res;
	}

	create_users(em: EntityManager): User[] {
		const res: User[] = [];

		const users: Partial<User>[] = [
			// Unverified user
			// > Email not verified
			{
				email: 'unverified@email.com',
				email_verified: false,
				email_verification: hashSync('token67891012', 10), // used in auth.e2e-spec.ts
				password: hashSync('root', 10),
				first_name: 'unverified',
				last_name: 'user',
				birth_date: new Date('2000-01-01'),
			},
			// Unauthorized user
			// > No permissions (but email verified)
			{
				email: 'unauthorized@email.com',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'unauthorized',
				last_name: 'user',
				birth_date: new Date('2000-01-01'),
			},
			// Logs user
			// > CAN_READ_LOGS_OF_USER & CAN_EDIT_LOGS_OF_USER permissions
			{
				email: 'logs@email.com',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'logs',
				last_name: 'moderator',
				birth_date: new Date('2000-01-01'),
			},
			// Permission moderator user
			// > CAN_READ_PERMISSIONS_OF_USER & CAN_EDIT_PERMISSIONS_OF_USER permissions
			{
				email: 'perms@email.com',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'perms',
				last_name: 'moderator',
				birth_date: new Date('2000-01-01'),
			},
			// Promotion moderator user
			// > CAN_READ_PROMOTION & CAN_EDIT_PROMOTION permissions
			{
				email: 'promos@email.com',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'promos',
				last_name: 'moderator',
				birth_date: new Date('2000-01-01'),
			},
			// Role moderator user
			// > CAN_READ_ROLE & CAN_EDIT_ROLE permissions
			{
				email: 'roles@email.com',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'promos',
				last_name: 'moderator',
				birth_date: new Date('2000-01-01'),
			},
			// Subscriber
			{
				email: 'subscriber@email.com',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'subscribed',
				last_name: 'user',
				birth_date: new Date('2000-01-01'),
				subscribed: true,
			},
		];

		for (const user of users) {
			const u = em.create(User, user);
			em.create(UserVisibility, { user: u });
			res.push(u);
		}

		return res;
	}
}
