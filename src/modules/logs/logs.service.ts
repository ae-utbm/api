import type { I18nTranslations } from '@types';

import { UsersService } from '@modules/users/users.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';

import { Log } from './entities/log.entity';
import { I18nService } from 'nestjs-i18n';
import { idInvalid, idNotFound } from '@utils/responses';
import { User } from '@modules/users/entities/user.entity';

@Injectable()
export class LogsService {
	constructor(
		private readonly usersService: UsersService,
		private readonly i18n: I18nService<I18nTranslations>,
		private readonly orm: MikroORM,
	) {}

	/**
	 * Remove all logs that are older than 2 months each day at 7am
	 */
	@Cron('0 0 7 * * *')
	@UseRequestContext()
	async handleCron() {
		await this.orm.em.nativeDelete(Log, { created_at: { $lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60) } });
	}

	async getUserLogs(id: number) {
		if (typeof id === 'string' && parseInt(id, 10) != id)
			throw new BadRequestException(idInvalid({ i18n: this.i18n, type: User, id }));

		const user = await this.usersService.findOne({ id });
		if (!user) throw new NotFoundException(idNotFound({ i18n: this.i18n, type: User, id }));

		await user.logs.init();

		return user.logs.getItems();
	}

	async deleteUserLogs(id: number) {
		const user = await this.usersService.findOne({ id });
		await user.logs.init();
		user.logs.removeAll();

		return { message: 'User logs deleted' };
	}
}
