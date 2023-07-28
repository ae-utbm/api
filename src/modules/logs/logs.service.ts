import type { I18nTranslations } from '@types';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { I18nService } from 'nestjs-i18n';

import { User } from '@modules/users/entities/user.entity';
import { UsersService } from '@modules/users/users.service';
import { deleteSuccess, idInvalid } from '@utils/responses';

import { Log } from './entities/log.entity';

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

		await user.logs.init();
		return user.logs.getItems();
	}

	async deleteUserLogs(id: number) {
		if (typeof id === 'string' && parseInt(id, 10) != id)
			throw new BadRequestException(idInvalid({ i18n: this.i18n, type: User, id }));

		const user = await this.usersService.findOne({ id });
		await user.logs.init();
		user.logs.removeAll();

		return { message: deleteSuccess({ i18n: this.i18n, type: Log }), statusCode: 200 };
	}
}
