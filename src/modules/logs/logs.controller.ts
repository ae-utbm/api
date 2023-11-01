import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiParam, ApiOperation } from '@nestjs/swagger';
import { z } from 'zod';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/error.decorator';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { validate } from '@utils/validate';

import { LogDTO } from './dto/get.dto';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Logs')
@ApiBearerAuth()
export class LogsController {
	constructor(private readonly logsService: LogsService, private readonly t: TranslateService) {}

	@Get('user/:user_id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('user_id', ['CAN_READ_LOGS_OF_USER'])
	@ApiOperation({ summary: 'Get all logs of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User logs retrieved', type: [LogDTO] })
	@ApiNotOkResponses({ 400: 'Invalid user ID', 404: 'User not found' })
	async getUserLogs(@Param('user_id') id: number): Promise<LogDTO[]> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.logsService.getUserLogs(id);
	}

	@Delete('user/:user_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_DELETE_LOGS_OF_USER')
	@ApiOperation({ summary: 'Delete all logs of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User logs deleted', type: MessageResponseDTO })
	@ApiNotOkResponses({ 400: 'Invalid user ID', 404: 'User not found' })
	async deleteUserLogs(@Param('user_id') id: number): Promise<MessageResponseDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.logsService.deleteUserLogs(id);
	}
}
