import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
	ApiTags,
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiBadRequestResponse,
	ApiOkResponse,
	ApiParam,
	ApiOperation,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { Log } from './entities/log.entity';
import { MessageResponseDTO } from '@modules/_mixin/dto/message-response.dto';

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Logs')
@ApiBearerAuth()
export class LogsController {
	constructor(private readonly logsService: LogsService) {}

	@Get('user/:id')
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid user ID' })
	@ApiOkResponse({ description: 'User logs retrieved', type: [Log] })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOperation({ summary: 'Get all logs of a user' })
	getUserLogs(@Param('id') id: number) {
		return this.logsService.getUserLogs(id);
	}

	@Delete('user/:id')
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid user ID' })
	@ApiOkResponse({ description: 'User logs deleted', type: MessageResponseDTO })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOperation({ summary: 'Delete all logs of a user' })
	deleteUserLogs(@Param('id') id: number) {
		return this.logsService.deleteUserLogs(id);
	}
}
