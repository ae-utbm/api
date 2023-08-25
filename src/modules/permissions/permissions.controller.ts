import type { I18nTranslations, PermissionEntity } from '@types';

import { Body, Controller, Get, Param, Post, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { validateObject } from '@utils/validate';

import { PermissionPatchDTO } from './dto/patch.dto';
import { PermissionPostDTO } from './dto/post.dto';
import { Permission } from './entities/permission.entity';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Permissions')
@ApiBearerAuth()
export class PermissionsController {
	constructor(
		private readonly permsService: PermissionsService,
		private readonly i18n: I18nService<I18nTranslations>,
	) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Add a permission to a user' })
	@ApiOkResponse({ description: 'The added permission', type: Permission })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	addToUser(@Body() body: PermissionPostDTO): Promise<PermissionEntity<number>> {
		validateObject({
			objectToValidate: body,
			objectType: PermissionPostDTO,
			requiredKeys: ['expires', 'id', 'permission'],
			i18n: this.i18n,
		});

		return this.permsService.addPermissionToUser(body);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Edit permission of a user' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiOkResponse({ description: 'The modified user permission', type: Permission })
	editPermissionFromUser(@Body() body: PermissionPatchDTO) {
		validateObject({
			objectToValidate: body,
			objectType: PermissionPatchDTO,
			requiredKeys: ['id'],
			optionalKeys: ['expires', 'revoked', 'user_id', 'name'],
			i18n: this.i18n,
		});

		return this.permsService.editPermissionOfUser(body);
	}

	@Get(':user_id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('user_id', ['CAN_READ_PERMISSIONS_OF_USER'])
	@ApiOperation({ summary: 'Get all permissions of a user (active, revoked and expired)' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiOkResponse({ description: 'User permission(s) retrieved', type: [Permission] })
	@ApiParam({ name: 'user_id', description: 'The user ID' })
	getUserPermissions(@Param('user_id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.permsService.getPermissionsOfUser(id);
	}
}
