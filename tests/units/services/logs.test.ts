import { Log } from '@modules/logs/entities/log.entity';
import { LogsService } from '@modules/logs/logs.service';
import { User } from '@modules/users/entities/user.entity';

import { moduleFixture, orm } from '../..';

describe('LogsService', () => {
	let logsService: LogsService;

	beforeAll(() => {
		logsService = moduleFixture.get<LogsService>(LogsService);
	});

	describe('LogsService.deleteOldLogs()', () => {
		it('Should delete logs that are older than 60 days', async () => {
			// First we create a log that is older than 60 days
			const user = await orm.em.findOne(User, { id: 1 });
			const log = orm.em.create(Log, {
				user,
				action: '',
				ip: '',
				user_agent: '',
				route: '',
				method: '',
				body: '',
				query: '',
				params: '',
			});

			log.created_at = new Date(Date.now() - 1000 * 60 * 60 * 24 * 61);
			await orm.em.persistAndFlush(log);
			// ------------------------------

			const A = await orm.em.findOne(Log, { id: log.id });
			expect(A).toBeDefined();

			await logsService.deleteOldLogs();

			const B = await orm.em.findOne(Log, { id: log.id });
			expect(B).toBeNull();
		});
	});
});
