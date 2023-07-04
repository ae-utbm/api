import { MikroORM } from '@mikro-orm/core';
import { UsersService } from '@modules/users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { LogsService } from './logs.service';

import { User } from '@modules/users/entities/user.entity';

describe('LogsService', () => {
	let logsService: LogsService;
	let usersService: UsersService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LogsService,
				{
					provide: UsersService,
					useValue: {
						findOne: jest.fn(),
					},
				},
				{
					provide: MikroORM,
					useValue: {
						em: {
							nativeDelete: jest.fn().mockResolvedValue(undefined),
						},
					},
				},
			],
		}).compile();

		logsService = module.get<LogsService>(LogsService);
		usersService = module.get<UsersService>(UsersService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUserLogs', () => {
		it('should return user logs', async () => {
			const userId = 1;
			const user = {
				id: userId,
				logs: {
					init: jest.fn(),
					getItems: jest.fn().mockResolvedValue([]),
				},
			} as unknown as User;

			jest.spyOn(usersService, 'findOne').mockResolvedValue(user);

			const result = await logsService.getUserLogs(userId);

			expect(usersService.findOne).toHaveBeenCalledWith({ id: userId });
			expect(user.logs.init).toHaveBeenCalled();
			expect(user.logs.getItems).toHaveBeenCalled();
			expect(result).toEqual([]);
		});
	});

	describe('deleteUserLogs', () => {
		it('should delete user logs', async () => {
			const userId = 1;
			const user = {
				id: userId,
				logs: {
					init: jest.fn(),
					removeAll: jest.fn(),
				},
			} as unknown as User;

			jest.spyOn(usersService, 'findOne').mockResolvedValue(user);

			const result = await logsService.deleteUserLogs(userId);

			expect(usersService.findOne).toHaveBeenCalledWith({ id: userId });
			expect(user.logs.init).toHaveBeenCalled();
			expect(user.logs.removeAll).toHaveBeenCalled();
			expect(result).toEqual({ message: 'User logs deleted' });
		});
	});
});
