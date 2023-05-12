import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { PERMISSIONS } from '@modules/perms/perms';
import { Permission } from '@modules/perms/entities/permission.entity';
import { User } from '@modules/users/entities/user.entity';
import { Role } from '@modules/roles/entities/role.entity';

import * as bcrypt from 'bcrypt';
import { Promotion } from '@modules/promotions/entities/promotion.entity';

/**
 * This class is used to populate the database with some base data
 * (e.g. the root user)
 */
export class DatabaseSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
		// Create root user
		const user_root = em.create(User, {
			email: 'ae.info@utbm.fr',
			password: await bcrypt.hash('root', 10),
			first_name: 'root',
			last_name: 'root',
			nickname: 'noot noot',
			birthday: new Date('2000-01-01'),
		});

		em.create(UserVisibility, { user: user_root });

		// Add root permission to the root user
		em.create(Permission, {
			name: 'ROOT',
			expires: new Date('2100-01-01'),
			user: user_root,
		});

		// Create 1 user which would have the admin role
		const user_admin = em.create(User, {
			email: 'ae@utbm.fr',
			password: await bcrypt.hash('root', 10),
			first_name: 'ae',
			last_name: 'ae',
			birthday: new Date('2000-01-01'),
		});

		em.create(UserVisibility, { user: user_admin });

		// Create admin role (all permissions except ROOT)
		const admin = em.create(Role, {
			name: 'ADMIN',
			permissions: PERMISSIONS.filter((p) => p.name !== 'ROOT').map((p) => p.name),
			expires: new Date('2100-01-01'),
		});

		// Add admin role to user2
		user_admin.roles.add(admin);

		for (let i = 0; i < 30; i++) {
			em.create(Promotion, { number: i + 1 });
		}

		user_root.promotion = await em.findOneOrFail(Promotion, { number: 1 });
		user_admin.promotion = await em.findOneOrFail(Promotion, { number: 21 });

		em.persistAndFlush([user_root, user_admin]);
	}
}
