import { Role } from '@modules/roles/entities/role.entity';
import { RolesService } from '@modules/roles/roles.service';

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
				expires: new Date(Date.now() - 1000 * 60 * 60 * 24),
				permissions: ['ROOT'],
			});

			await orm.em.persistAndFlush(role);
			// ------------------------------

			const A = await orm.em.findOne(Role, { id: role.id });
			expect(A).toBeDefined();
			expect(A.revoked).toBe(false);

			await rolesService.revokeExpiredRoles();

			// we fork the entity manager to get the latest data
			const B = await orm.em.fork().findOne(Role, { id: role.id });
			expect(B).toBeDefined();
			expect(B.revoked).toBe(true);

			// We remove the test role from the database
			await orm.em.removeAndFlush(B);
		});
	});
});
