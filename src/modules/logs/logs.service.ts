import { UsersService } from '@modules/users/users.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LogsService {
	constructor(private readonly usersService: UsersService) {}

	async getUserLogs(id: number) {
		const user = await this.usersService.findOne({ id });
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
