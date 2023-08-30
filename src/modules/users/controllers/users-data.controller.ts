import type { Request } from 'express';

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { UserPostByAdminDTO } from '@modules/auth/dto/register.dto';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { TranslateService } from '@modules/translate/translate.service';
import { validateObject } from '@utils/validate';

import { UserPatchDTO } from '../dto/patch.dto';
import { UserVisibility } from '../entities/user-visibility.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersDataController {
	constructor(private readonly usersService: UsersService, private readonly t: TranslateService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Create a new user' })
	@ApiOkResponse({ description: 'The created user', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async create(@Body() input: UserPostByAdminDTO) {
		validateObject({
			objectToValidate: input,
			objectType: UserPostByAdminDTO,
			requiredKeys: ['email', 'birth_date', 'first_name', 'last_name'],
			t: this.t,
		});

		return this.usersService.registerByAdmin(input);
	}

	@Patch()
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update an existing user' })
	@ApiOkResponse({ description: 'The updated user', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async update(@Req() req: Request & { user: User }, @Body() input: UserPatchDTO) {
		validateObject({
			objectToValidate: input,
			objectType: UserPatchDTO,
			requiredKeys: ['id'],
			optionalKeys: [
				'email',
				'password',
				'birth_date',
				'first_name',
				'last_name',
				'nickname',
				'gender',
				'pronouns',
				'secondary_email',
				'phone',
				'parent_contact',
				'cursus',
				'specialty',
				'promotion',
			],
			t: this.t,
		});

		return this.usersService.update(req.user.id, input);
	}

	@Delete(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_DELETE_USER'])
	@ApiOperation({ summary: 'Delete a user' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async delete(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'id'));

		return this.usersService.delete(id);
	}

	@Get(':id/data')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get private information of a user' })
	@ApiOkResponse({ description: 'User data', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPrivate(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'id'));

		return this.usersService.findOne({ id }, false);
	}

	@Get(':id/data/public')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get public information of a user' })
	@ApiOkResponse({ description: 'User data, excepted privates fields (set in the visibility table)', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPublic(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'id'));

		return this.usersService.findOne({ id });
	}

	@Get(':id/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get visibility of a user' })
	@ApiOkResponse({ description: 'User data', type: UserVisibility })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getVisibility(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'id'));

		return this.usersService.findVisibilities([id]);
	}

	@Get(':id/roles')
	@UseGuards(PermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get roles of a user' })
	@ApiOkResponse({ description: 'Roles of the user', type: [Role] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getUserRoles(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'id'));

		return this.usersService.getUserRoles(id, { show_expired: true, show_revoked: true });
	}

	@Get(':id/permissions')
	@UseGuards(PermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get permissions of a user' })
	@ApiOkResponse({ description: 'Permissions of the user', type: [Permission] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getUserPermissions(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(this.t.Errors.Field.Invalid(Number, 'id'));

		return this.usersService.getUserPermissions(id, { show_expired: true, show_revoked: true });
	}
}
