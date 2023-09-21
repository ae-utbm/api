import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { TranslateService } from '@modules/translate/translate.service';
import { UsersService } from '@modules/users/users.service';

import { Log } from './entities/log.entity';

@Injectable()
export class LogsService {
	constructor(
		private readonly orm: MikroORM,
		private readonly t: TranslateService,
		private readonly usersService: UsersService,
	) {}

	/**
	 * Remove all logs that are older than 2 months each day at 7am
	 */
	@Cron('0 0 7 * * *')
	@UseRequestContext()
	async deleteOldLogs() {
		await this.orm.em.nativeDelete(Log, { created: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) } });
	}

	async getUserLogs(id: number): Promise<(Omit<Log, 'user'> & { user: number })[]> {
		const user = await this.usersService.findOne(id, false);
		const logs = (await user.logs.loadItems()).map((log) => ({ ...log, user: log.user.id }));

		return logs;
	}

	async deleteUserLogs(id: number) {
		const user = await this.usersService.findOne(id, false);
		await user.logs.init();
		user.logs.removeAll();

		return { message: this.t.Success.Entity.Deleted(Log), statusCode: 200 };
	}
}
