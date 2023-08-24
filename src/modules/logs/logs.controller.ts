import type { I18nTranslations } from '@types';

import { BadRequestException, Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
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
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { MessageResponseDTO } from '@modules/_mixin/dto/message-response.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';

import { Log } from './entities/log.entity';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Logs')
@ApiBearerAuth()
export class LogsController {
	constructor(private readonly logsService: LogsService, private readonly i18n: I18nService<I18nTranslations>) {}

	@Get('user/:user_id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('user_id', ['CAN_READ_LOGS_OF_USER'])
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid user ID' })
	@ApiOkResponse({ description: 'User logs retrieved', type: [Log] })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOperation({ summary: 'Get all logs of a user' })
	getUserLogs(@Param('user_id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.logsService.getUserLogs(id);
	}

	@Delete('user/:user_id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_DELETE_LOGS_OF_USER')
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiBadRequestResponse({ description: 'Invalid user ID' })
	@ApiOkResponse({ description: 'User logs deleted', type: MessageResponseDTO })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOperation({ summary: 'Delete all logs of a user' })
	deleteUserLogs(@Param('user_id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.logsService.deleteUserLogs(id);
	}
}
