import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';

import * as bcrypt from 'bcrypt';

/**
 * This class is used to populate the database with some base data
 * (e.g. the root user)
 */
export class DatabaseSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
		const promotions = this.create_promotions(em);
		const users = this.create_users(em);

		const root = users.find((u) => u.email === 'ae.info@utbm.fr');

		// Assign permission to users
		em.create(Permission, {
			name: 'ROOT',
			expires: new Date('9999-12-31'),
			user: root,
		});

		// Assign promotion to users
		root.promotion = promotions.find((p) => p.number === 21);

		em.persistAndFlush([...users, ...promotions]);
	}

	create_promotions(em: EntityManager): Promotion[] {
		const res: Promotion[] = [];
		const year = new Date().getFullYear();

		for (let i = 1; i <= year - 1998; i++) {
			res.push(em.create(Promotion, { number: i }));
		}

		return res;
	}

	create_users(em: EntityManager): User[] {
		const res: User[] = [];

		const users: Partial<User>[] = [
			// Root user
			{
				email: 'ae.info@utbm.fr',
				email_verified: true,
				password: bcrypt.hashSync('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birthday: new Date('2000-01-01'),
			},
			// Unverified user
			{
				email: 'unverified@email.com',
				email_verified: false,
				email_verification: bcrypt.hashSync('token', 10),
				password: bcrypt.hashSync('root', 10),
				first_name: 'unverified',
				last_name: 'unverified',
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
