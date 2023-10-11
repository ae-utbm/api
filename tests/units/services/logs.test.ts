import { Log } from '@modules/logs/entities/log.entity';
import { LogsService } from '@modules/logs/logs.service';
import { User } from '@modules/users/entities/user.entity';

import { moduleFixture, orm } from '../..';

describe('LogsService (unit)', () => {
	let logsService: LogsService;
	let em: typeof orm.em;

	beforeAll(() => {
		em = orm.em.fork();
		logsService = moduleFixture.get<LogsService>(LogsService);
	});

	describe('.deleteOldLogs()', () => {
		it('should delete logs that are older than 60 days', async () => {
			// First we create a log that is older than 60 days
			const user = await em.findOne(User, { id: 1 });
			const log = em.create(Log, {
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

			log.created = new Date(Date.now() - 1000 * 60 * 60 * 24 * 61);
			await em.persistAndFlush(log);
			// ------------------------------

			const A = await em.findOne(Log, { id: log.id });
			expect(A).toBeDefined();

			await logsService.deleteOldLogs();

			const B = await em.fork().findOne(Log, { id: log.id });
			expect(B).toBeNull();
		});
	});
});
