import type { EntityManager } from '@mikro-orm/core';

import { Permission } from '@/modules/perms/entities/permission.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Seeder } from '@mikro-orm/seeder';

import * as bcrypt from 'bcrypt';

export class DatabaseSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
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
	}
}
