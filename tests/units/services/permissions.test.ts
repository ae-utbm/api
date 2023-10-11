import { Permission } from '@modules/permissions/entities/permission.entity';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { User } from '@modules/users/entities/user.entity';

import { moduleFixture, orm } from '../..';

describe('PermissionsService (unit)', () => {
	let permissionsService: PermissionsService;
	let em: typeof orm.em;

	beforeAll(() => {
		em = orm.em.fork();
		permissionsService = moduleFixture.get<PermissionsService>(PermissionsService);
	});

	describe('.revokeExpiredPermissions()', () => {
		it('should revoke permissions that have expired', async () => {
			// First we add a permission that is expired
			const permission = em.create(Permission, {
				name: 'CAN_DELETE_LOGS_OF_USER',
				revoked: false,
				expires: new Date(Date.now() - 1000 * 60 * 60 * 24),
				user: await em.findOne(User, { id: 1 }),
			});

			await em.persistAndFlush(permission);
			// ------------------------------

			const A = await em.findOne(Permission, { id: permission.id });
			expect(A).toBeDefined();
			expect(A.revoked).toBe(false);

			await permissionsService.revokeExpiredPermissions();

			// we fork the entity manager to get the latest data
			const B = await em.fork().findOne(Permission, { id: permission.id });
			expect(B).toBeDefined();
			expect(B.revoked).toBe(true);

			await em.removeAndFlush(B);
		});
	});
});
