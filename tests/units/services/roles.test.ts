import { RoleExpiration } from '@modules/roles/entities/role-expiration.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { RolesService } from '@modules/roles/roles.service';
import { User } from '@modules/users/entities/user.entity';

import { moduleFixture, orm } from '../..';

describe('RolesService (unit)', () => {
	let rolesService: RolesService;
	let em: typeof orm.em;

	beforeAll(() => {
		em = orm.em.fork();
		rolesService = moduleFixture.get<RolesService>(RolesService);
	});

	describe('.revokeExpiredRoles()', () => {
		it('should revoke roles that have expired', async () => {
			// We add a role that is expired in the database
			const role = em.create(Role, {
				name: 'TEST_ROLE',
				revoked: false,
				permissions: ['ROOT'],
			});

			const user = await em.findOne(User, { id: 1 });
			const role_expiration = em.create(RoleExpiration, {
				role,
				user,
				expires: new Date(Date.now() - 1000),
			});

			await em.persistAndFlush([role, role_expiration]);
			// ------------------------------

			const A = await em.findOne(RoleExpiration, { role, user });
			expect(A).toBeDefined();
			expect(A.revoked).toBe(false);

			await rolesService.revokeExpiredRoles();

			// we fork the entity manager to get the latest data
			const B = await em.fork().findOne(RoleExpiration, { role, user });
			expect(B).toBeDefined();
			expect(B.revoked).toBe(true);

			// We remove the test role from the database
			await em.removeAndFlush([B, role]);
		});
	});
});
