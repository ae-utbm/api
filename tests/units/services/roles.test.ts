import { RoleExpiration } from '@modules/roles/entities/role-expiration.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { RolesService } from '@modules/roles/roles.service';
import { User } from '@modules/users/entities/user.entity';

import { moduleFixture, orm } from '../..';

describe('RolesService (unit)', () => {
	let rolesService: RolesService;

	beforeAll(() => {
		rolesService = moduleFixture.get<RolesService>(RolesService);
	});

	describe('.revokeExpiredRoles()', () => {
		it('should revoke roles that have expired', async () => {
			// We add a role that is expired in the database
			const role = orm.em.create(Role, {
				name: 'TEST_ROLE',
				revoked: false,
				permissions: ['ROOT'],
			});

			const user = await orm.em.findOne(User, { id: 1 });
			const role_expiration = orm.em.create(RoleExpiration, {
				role,
				user,
				expires: new Date(Date.now() - 1000),
			});

			await orm.em.persistAndFlush([role, role_expiration]);
			// ------------------------------

			const A = await orm.em.findOne(RoleExpiration, { role, user });
			expect(A).toBeDefined();
			expect(A.revoked).toBe(false);

			await rolesService.revokeExpiredRoles();

			// we fork the entity manager to get the latest data
			const B = await orm.em.fork().findOne(RoleExpiration, { role, user });
			expect(B).toBeDefined();
			expect(B.revoked).toBe(true);

			// We remove the test role from the database
			await orm.em.removeAndFlush([B, role]);
		});
	});
});
