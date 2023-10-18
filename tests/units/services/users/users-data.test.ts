import { hashSync } from 'bcrypt';

import { Permission } from '@modules/permissions/entities/permission.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { module_fixture, orm } from '../../..';

describe('UsersDataService (unit)', () => {
	let usersDataService: UsersDataService;
	let em: typeof orm.em;

	beforeAll(() => {
		em = orm.em.fork();
		usersDataService = module_fixture.get<UsersDataService>(UsersDataService);
	});

	describe('.deleteUnverifiedUsers()', () => {
		it('should delete users that are unverified and older than 7 days', async () => {
			// First we create a user that is unverified and older than 7 days
			const user = em.create(User, {
				email: 'unverified_user@example.fr',
				email_verified: true,
				password: hashSync('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birth_date: new Date('2000-01-01'),
				created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
			});

			await em.persistAndFlush(user);
			// ------------------------------

			const A = await em.findOne(User, { id: user.id });
			expect(A).toBeDefined();

			await usersDataService.deleteUnverifiedUsers();

			const B = await em.fork().findOne(User, { id: user.id });
			expect(B).toBeNull();
		});
	});

	describe('.hasPermissionOrRoleWithPermission()', () => {
		let user: User;

		beforeAll(async () => {
			// First we create a user that is unverified and older than 7 days
			const u0 = em.create(User, {
				email: 'user@example.fr',
				email_verified: true,
				password: hashSync('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birth_date: new Date('2000-01-01'),
			});

			await em.persistAndFlush(u0);

			// fetch again to get user id
			const perm = em.create(Permission, {
				name: 'CAN_READ_LOGS_OF_USER',
				expires: new Date('9999-12-31'),
				user: u0,
			});

			u0.roles.add(await em.findOne(Role, { name: 'PERMISSIONS_MODERATOR' }));
			await em.persistAndFlush([u0, perm]);

			user = await em.findOne(User, { email: u0.email }, { populate: ['roles', 'permissions'] });
		});

		afterAll(async () => {
			await em.removeAndFlush(user);
		});

		it('should return true if user has at least 1 permission', async () => {
			const res = await usersDataService.hasPermissionOrRoleWithPermission(user.id, false, [
				'CAN_READ_LOGS_OF_USER',
				'CAN_DELETE_LOGS_OF_USER',
			]);

			expect(res).toBe(true);
		});

		it('should return false if the user does not have all permissions', async () => {
			const res = await usersDataService.hasPermissionOrRoleWithPermission(user.id, true, [
				'CAN_READ_LOGS_OF_USER',
				'CAN_DELETE_LOGS_OF_USER',
			]);

			expect(res).toBe(false);
		});
	});
});
