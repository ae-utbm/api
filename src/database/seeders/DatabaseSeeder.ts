import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { PERMISSIONS } from '@/modules/auth/decorators/perms.decorator';
import { Permission } from '@/modules/perms/entities/permission.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/modules/roles/entities/role.entity';

import * as bcrypt from 'bcrypt';

export class DatabaseSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
		// Create root user
		const user = em.create(User, {
			email: 'ae.info@utbm.fr',
			password: await bcrypt.hash('root', 10),
			firstName: 'root',
			lastName: 'root',
			birthday: new Date('2000-01-01'),
		});

		em.create(Permission, {
			name: 'ROOT',
			expires: new Date('2100-01-01'),
			user,
		});

		// Create 1 user which would have the admin role
		const user2 = em.create(User, {
			email: 'ae@utbm.fr',
			password: await bcrypt.hash('root', 10),
			firstName: 'ae',
			lastName: 'ae',
			birthday: new Date('2000-01-01'),
		});

		// Create admin role (all permissions except ROOT)
		const admin = em.create(Role, {
			name: 'ADMIN',
			permissions: PERMISSIONS.filter((p) => p.name !== 'ROOT').map((p) => p.name),
			expires: new Date('2100-01-01'),
		});

		// Add admin role to user2
		user2.roles.add(admin);
		em.persistAndFlush([user2]);
	}
}
