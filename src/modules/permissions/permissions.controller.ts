import { Body, Controller, Get, Param, Post, UseGuards, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/error.decorator';
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
	@ApiNotOkResponses({
		400: 'Bad request, invalid fields',
		404: 'User not found',
	})
	async addToUser(@Body() body: PermissionPostDTO): Promise<PermissionGetDTO> {
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
	@ApiOkResponse({ description: 'The modified user permission', type: PermissionGetDTO })
	@ApiNotOkResponses({ 404: 'User/permission not found' })
	async editPermissionFromUser(@Body() body: PermissionPatchDTO): Promise<PermissionGetDTO> {
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
	@ApiParam({ name: 'user_id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User permission(s) retrieved', type: [PermissionGetDTO] })
	@ApiNotOkResponses({ 404: 'User not found' })
	async getUserPermissions(@Param('user_id') id: number): Promise<PermissionGetDTO[]> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.permsService.getPermissionsOfUser(id);
	}
}
