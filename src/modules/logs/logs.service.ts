import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { TranslateService } from '@modules/translate/translate.service';

import { LogDTO } from './dto/get.dto';
import { Log } from './entities/log.entity';

@Injectable()
export class LogsService {
	constructor(private readonly orm: MikroORM, private readonly t: TranslateService) {}

	/**
	 * Remove all logs that are older than 2 months each day at 7am
	 */
	@Cron('0 0 7 * * *')
	@CreateRequestContext()
	async deleteOldLogs() {
		await this.orm.em.nativeDelete(Log, { created: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) } });
	}

	async getUserLogs(id: number): Promise<LogDTO[]> {
		return (await this.orm.em.find(Log, { user: id })).map((log) => ({ ...log, user: log.user.id }));
	}

	async deleteUserLogs(id: number) {
		await this.orm.em.nativeDelete(Log, { user: id });
		return { message: this.t.Success.Entity.Deleted(Log), statusCode: 200 };
	}
}
