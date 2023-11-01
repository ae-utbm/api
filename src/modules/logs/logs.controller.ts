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
import { z } from 'zod';

import { ErrorResponseDTO } from '@modules/_mixin/dto/error.dto';
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
	@ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDTO })
	@ApiBadRequestResponse({ description: 'Invalid user ID', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'User logs retrieved', type: [LogDTO] })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOperation({ summary: 'Get all logs of a user' })
	getUserLogs(@Param('user_id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.logsService.getUserLogs(id);
	}

	@Delete('user/:user_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_DELETE_LOGS_OF_USER')
	@ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDTO })
	@ApiBadRequestResponse({ description: 'Invalid user ID', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'User logs deleted', type: MessageResponseDTO })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOperation({ summary: 'Delete all logs of a user' })
	deleteUserLogs(@Param('user_id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.logsService.deleteUserLogs(id);
	}
}
