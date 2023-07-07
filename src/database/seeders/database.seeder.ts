import type { EntityManager } from '@mikro-orm/core';

import { Seeder } from '@mikro-orm/seeder';
import { hashSync } from 'bcrypt';

import { Permission } from '@modules/permissions/entities/permission.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { UserVisibility } from '@modules/users/entities/user-visibility.entity';
import { User } from '@modules/users/entities/user.entity';

/**
 * This class is used to populate the database with some base data
 * (e.g. the root user)
 */
export class DatabaseSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
		const promotions = this.create_promotions(em);
		const users = this.create_users(em);

		const root = users.find((u) => u.email === 'ae.info@utbm.fr');
		const logs = users.find((u) => u.email === 'logs@email.com');

		// Assign permission to users
		const perms = [
			em.create(Permission, {
				name: 'ROOT',
				expires: new Date('9999-12-31'),
				user: root,
			}),

			em.create(Permission, {
				name: 'CAN_READ_LOGS_OF_USER',
				expires: new Date('9999-12-31'),
				user: logs,
			}),

			em.create(Permission, {
				name: 'CAN_DELETE_LOGS_OF_USER',
				expires: new Date('9999-12-31'),
				user: logs,
			}),
		];

		// Assign promotion to users
		root.promotion = promotions.find((p) => p.number === 21);

		await em.persistAndFlush([...users, ...perms, ...promotions]);
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
			// > ROOT Permissions
			{
				email: 'ae.info@utbm.fr',
				email_verified: true,
				password: hashSync('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birthday: new Date('2000-01-01'),
			},
			// Unverified user
			// > Email not verified
			{
				email: 'unverified@email.com',
				email_verified: false,
				email_verification: hashSync('token', 10),
				password: hashSync('root', 10),
				first_name: 'unverified',
				last_name: 'user',
				birthday: new Date('2000-01-01'),
			},
			// Unauthorized user
			// > No permissions (but email verified)
			{
				email: 'unauthorized@email.com',
				email_verified: true,
				password: hashSync('root', 10),
				first_name: 'unauthorized',
				last_name: 'user',
				birthday: new Date('2000-01-01'),
			},
			// Logs user
			// > CAN_READ_LOGS_OF_USER & CAN_DELETE_LOGS_OF_USER permissions
			{
				email: 'logs@email.com',
				email_verified: true,
				password: hashSync('root', 10),
				first_name: 'logs',
				last_name: 'moderator',
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
