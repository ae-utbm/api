import type { EntityManager } from '@mikro-orm/core';

import { Seeder } from '@mikro-orm/seeder';
import { hashSync } from 'bcrypt';

import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
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
		const visibility_groups = this.create_visibility_groups(em);

		const root = users.find((u) => u.email === 'ae.info@utbm.fr');

		// Assign permission to root
		const perms = [
			em.create(Permission, {
				name: 'ROOT',
				expires: new Date('9999-12-31'),
				user: root,
			}),
		];

		// Assign promotion to root
		root.promotion = promotions.find((p) => p.number === 21);

		await em.persistAndFlush([...users, ...perms, ...promotions, ...visibility_groups]);
	}

	/**
	 * Create promotions present in the database by default (from 1999 to current year)
	 * @param {EntityManager} em the entity manager
	 * @returns List of promotions created
	 */
	create_promotions(em: EntityManager): Promotion[] {
		const res: Promotion[] = [];
		const year = new Date().getFullYear();

		for (let i = 1; i <= year - 1998; i++) {
			res.push(em.create(Promotion, { number: i }));
		}

		return res;
	}

	/**
	 * Create users present in the database by default
	 * @param {EntityManager} em the entity manager
	 * @returns List of users created
	 */
	create_users(em: EntityManager): User[] {
		const res: User[] = [];

		const users: Partial<User>[] = [
			// Root user
			// > ROOT Permissions
			{
				email: 'ae.info@utbm.fr',
				email_verified: true,
				verified: new Date('2000-01-01'),
				password: hashSync('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birth_date: new Date('2000-01-01'),
			},
		];

		for (const user of users) {
			const u = em.create(User, user);
			em.create(UserVisibility, { user: u });
			res.push(u);
		}

		return res;
	}

	/**
	 * Create visibility groups present in the database by default (e.g. SUBSCRIBER)
	 * @param {EntityManager} em the entity manager
	 * @returns List of visibility groups created
	 */
	create_visibility_groups(em: EntityManager): FileVisibilityGroup[] {
		const res: FileVisibilityGroup[] = [];

		const visibilities: Partial<FileVisibilityGroup>[] = [
			{
				name: 'SUBSCRIBER',
				description: 'Files visible to subscribers',
			},
		];

		for (const visibility of visibilities) {
			res.push(em.create(FileVisibilityGroup, visibility));
		}

		return res;
	}
}
