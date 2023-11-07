import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiParam, ApiOperation } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/base/decorators/api-not-ok.decorator';
import { InputIdParamDTO } from '@modules/base/dto/input.dto';
import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';

import { OutputLogDTO } from './dto/output.dto';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Logs')
@ApiBearerAuth()
export class LogsController {
	constructor(private readonly logsService: LogsService) {}

	@Get('user/:id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_LOGS_OF_USER'])
	@ApiOperation({ summary: 'Get all logs of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User logs retrieved', type: [OutputLogDTO] })
	@ApiNotOkResponses({ 400: 'Invalid user ID', 404: 'User not found' })
	async getUserLogs(@Param() params: InputIdParamDTO): Promise<OutputLogDTO[]> {
		return this.logsService.getUserLogs(params.id);
	}

	@Delete('user/:id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_DELETE_LOGS_OF_USER')
	@ApiOperation({ summary: 'Delete all logs of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User logs deleted', type: OutputMessageDTO })
	@ApiNotOkResponses({ 400: 'Invalid user ID', 404: 'User not found' })
	async deleteUserLogs(@Param() params: InputIdParamDTO): Promise<OutputMessageDTO> {
		return this.logsService.deleteUserLogs(params.id);
	}
}
