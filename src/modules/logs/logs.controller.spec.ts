import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { UsersService } from '@modules/users/users.service';
import { MessageResponseDTO } from '@modules/_mixin/dto/message-response.dto';
import { Log } from './entities/log.entity';

import config from 'src/mikro-orm.config';

describe('LogsController', () => {
	let controller: LogsController;
	let logsService: LogsService;
	let usersService: UsersService;

	beforeEach(async () => {
		const configService = new ConfigService();
		const mikroOrmService = new MikroORM(config);

		usersService = new UsersService(configService, mikroOrmService);
		logsService = new LogsService(usersService, mikroOrmService);

		controller = new LogsController(logsService);
	});

	describe('getUserLogs', () => {
		it('should get all logs of a user', async () => {
			const userId = 1;
			const expectedLogs: Log[] = []; // Set the expected logs

			jest.spyOn(logsService, 'getUserLogs').mockResolvedValue(expectedLogs);

			const result = await controller.getUserLogs(userId);

			expect(logsService.getUserLogs).toHaveBeenCalledWith(userId);
			expect(result).toEqual(expectedLogs);
		});

		it('should throw an error when user is not found', async () => {
			const userId = 1;

			jest.spyOn(logsService, 'getUserLogs').mockRejectedValue(new Error('User not found'));

			await expect(controller.getUserLogs(userId)).rejects.toThrowError('User not found');
			expect(logsService.getUserLogs).toHaveBeenCalledWith(userId);
		});
	});

	describe('deleteUserLogs', () => {
		it('should delete all logs of a user', async () => {
			const userId = 1;
			const expectedResponse: MessageResponseDTO = { message: 'User logs deleted' };

			jest.spyOn(logsService, 'deleteUserLogs').mockResolvedValue(expectedResponse);

			const result = await controller.deleteUserLogs(userId);

			expect(logsService.deleteUserLogs).toHaveBeenCalledWith(userId);
			expect(result).toEqual(expectedResponse);
		});

		it('should throw an error when user is not found', async () => {
			const userId = 1;

			jest.spyOn(logsService, 'deleteUserLogs').mockRejectedValue(new Error('User not found'));

			await expect(controller.deleteUserLogs(userId)).rejects.toThrowError('User not found');
			expect(logsService.deleteUserLogs).toHaveBeenCalledWith(userId);
		});
	});
});
