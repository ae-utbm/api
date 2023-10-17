import { hashSync } from 'bcrypt';

import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { module_fixture, orm } from '../../..';

describe('UsersDataService (unit)', () => {
	let usersDataService: UsersDataService;
	let em: typeof orm.em;

	beforeAll(() => {
		em = orm.em.fork();
		usersDataService = module_fixture.get<UsersDataService>(UsersDataService);
	});

	describe('.deleteUnverifiedUsers()', () => {
		it('should delete users that are unverified and older than 7 days', async () => {
			// First we create a user that is unverified and older than 7 days
			const user = em.create(User, {
				email: 'unverified_user@example.fr',
				email_verified: true,
				password: hashSync('root', 10),
				first_name: 'root',
				last_name: 'root',
				nickname: 'noot noot',
				birth_date: new Date('2000-01-01'),
				created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
			});

			await em.persistAndFlush(user);
			// ------------------------------

			const A = await em.findOne(User, { id: user.id });
			expect(A).toBeDefined();

			await usersDataService.deleteUnverifiedUsers();

			const B = await em.fork().findOne(User, { id: user.id });
			expect(B).toBeNull();
		});
	});
});
