import { Body, Controller, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
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
import { z } from 'zod';

import { ErrorResponseDTO } from '@modules/_mixin/dto/error.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { validate } from '@utils/validate';

import { PermissionGetDTO } from './dto/get.dto';
import { PermissionPatchDTO } from './dto/patch.dto';
import { PermissionPostDTO } from './dto/post.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Permissions')
@ApiBearerAuth()
export class PermissionsController {
	constructor(private readonly permsService: PermissionsService, private readonly t: TranslateService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Add a permission to a user' })
	@ApiOkResponse({ description: 'The added permission', type: PermissionGetDTO })
	@ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDTO })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	addToUser(@Body() body: PermissionPostDTO) {
		const schema = z
			.object({
				expires: z.string().datetime(),
				id: z.number().int().min(1).optional(),
				permission: z.string(),
			})
			.strict();
		validate(schema, body);

		return this.permsService.addPermissionToUser(body);
	}

	@Patch()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PERMISSIONS_OF_USER')
	@ApiOperation({ summary: 'Edit permission of a user' })
	@ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDTO })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'The modified user permission', type: PermissionGetDTO })
	editPermissionFromUser(@Body() body: PermissionPatchDTO) {
		const schema = z
			.object({
				id: z.number().int().min(1),
				expires: z.string().datetime().optional(),
				revoked: z.boolean().optional(),
				user_id: z.number().int().min(1).optional(),
				name: z
					.string()
					.optional()
					.refine((name) => name === name.toUpperCase(), {}),
			})
			.strict();
		validate(schema, body);

		return this.permsService.editPermissionOfUser(body);
	}

	@Get(':user_id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('user_id', ['CAN_READ_PERMISSIONS_OF_USER'])
	@ApiOperation({ summary: 'Get all permissions of a user (active, revoked and expired)' })
	@ApiNotFoundResponse({ description: 'User not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiOkResponse({ description: 'User permission(s) retrieved', type: [PermissionGetDTO] })
	@ApiParam({ name: 'user_id', description: 'The user ID' })
	getUserPermissions(@Param('user_id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.permsService.getPermissionsOfUser(id);
	}
}
