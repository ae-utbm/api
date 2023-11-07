import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { OutputMessageDTO } from '@modules/_mixin/dto/output.dto';

import { OutputLogDTO } from './dto/output.dto';
import { Log } from './entities/log.entity';

@Injectable()
export class LogsService {
	constructor(private readonly orm: MikroORM) {}

	/**
	 * Remove all logs that are older than 2 months each day at 7am
	 */
	@Cron('0 0 7 * * *')
	@CreateRequestContext()
	async deleteOldLogs() {
		await this.orm.em.nativeDelete(Log, { created: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) } });
	}

	async getUserLogs(id: number): Promise<OutputLogDTO[]> {
		return (await this.orm.em.find(Log, { user: id })).map((log) => log.toObject() as unknown as OutputLogDTO);
	}

	async deleteUserLogs(id: number): Promise<OutputMessageDTO> {
		await this.orm.em.nativeDelete(Log, { user: id });
		return new OutputMessageDTO('validations.logs.success.deleted');
	}
}
