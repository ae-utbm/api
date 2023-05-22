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
		const users = await this.create_users(em);
		const roles = this.create_roles(em);
		const promotions = this.create_promotions(em);

		const ae = users.find((u) => u.email === 'ae@utbm.fr');
		const root = users.find((u) => u.email === 'ae.info@utbm.fr');

		// Assign roles to users
		ae.roles.add(roles.find((r) => r.name === 'ADMIN'));

		// Assign permission to users
		em.create(Permission, {
			name: 'ROOT',
			expires: new Date('9999-12-31'),
			user: root,
		});

		// Assign promotion to users
		ae.promotion = promotions.find((p) => p.number === 1);
		root.promotion = promotions.find((p) => p.number === 21);

		em.persistAndFlush([...users, ...roles, ...promotions]);
	}

	create_promotions(em: EntityManager): Promotion[] {
		const res: Promotion[] = [];
		const year = new Date().getFullYear();

		for (let i = 1; i <= year - 1998; i++) {
			res.push(em.create(Promotion, { number: i }));
		}

		return res;
	}

	create_roles(em: EntityManager): Role[] {
		const res: Role[] = [];

		const roles: Partial<Role>[] = [
			{
				name: 'ADMIN',
				permissions: PERMISSIONS.filter((p) => p.name !== 'ROOT').map((p) => p.name),
				expires: new Date('9999-12-31'),
			},
		];

		for (const role of roles) {
			res.push(em.create(Role, role));
		}

		return res;
	}

	async create_users(em: EntityManager): Promise<User[]> {
		const res: User[] = [];

		const users: Partial<User>[] = [
			{
				email: 'ae.info@utbm.fr',
				password: await bcrypt.hash('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birthday: new Date('2000-01-01'),
			},
			{
				email: 'ae@utbm.fr',
				password: await bcrypt.hash('root', 10),
				first_name: 'Association des Étudiants',
				last_name: 'UTBM',
				nickname: 'AE',
				birthday: new Date('2000-01-01'),
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
