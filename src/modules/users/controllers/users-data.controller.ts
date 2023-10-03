import type { RequestWithUser } from '#types/api';

import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { z } from 'zod';

import { USER_GENDER } from '@exported/api/constants/genders';
import { MessageResponseDTO } from '@modules/_mixin/dto/message-response.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { GuardSelfParam } from '@modules/auth/decorators/self.decorator';
import { UserPostByAdminDTO } from '@modules/auth/dto/register.dto';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { SelfGuard } from '@modules/auth/guards/self.guard';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { TranslateService } from '@modules/translate/translate.service';
import { validate } from '@utils/validate';

import { UserPatchDTO, UserVisibilityPatchDTO } from '../dto/patch.dto';
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
	@ApiOperation({ summary: 'Creates new users' })
	@ApiOkResponse({ description: 'The created user', type: [User] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBody({ type: [UserPostByAdminDTO] })
	async create(@Body() input: UserPostByAdminDTO[]) {
		const schema = z
			.object({
				email: z.string().email(),
				birth_date: z.string().datetime(),
				first_name: z.string(),
				last_name: z.string(),
			})
			.strict();

		validate(z.array(schema).min(1), input);

		return this.usersService.registerByAdmin(input);
	}

	@Patch()
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update users data' })
	@ApiOkResponse({ description: 'The updated users', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBody({ type: [UserPatchDTO] })
	async update(@Req() req: RequestWithUser, @Body() input: UserPatchDTO[]) {
		const schema = z
			.object({
				id: z.coerce.number(),
				email: z.string().email().optional(),
				password: z.string().optional(),
				birth_date: z.string().datetime().optional(),
				first_name: z.string().optional(),
				last_name: z.string().optional(),
				nickname: z.string().optional(),
				gender: z.enum(USER_GENDER).optional(),
				pronouns: z.string().optional(),
				secondary_email: z.string().email().optional(),
				phone: z.string().optional(),
				parent_contact: z.string().optional(),
				// TODO: to implement in an upcoming PR (see the user entity)
				// cursus: z.string().optional(),
				// specialty: z.string().optional(),
				promotion: z.coerce.number().optional(),
			})
			.strict();

		validate(z.array(schema).min(1), input);
		return this.usersService.update(req.user.id, input);
	}

	@Delete(':id')
	@UseGuards(SelfGuard)
	@GuardSelfParam('id')
	@ApiOperation({ summary: 'Delete your account' })
	@ApiOkResponse({ description: 'User deleted', type: MessageResponseDTO })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async delete(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.delete(id);
	}

	@Get(':id/data')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get all information of a user' })
	@ApiOkResponse({ description: 'User data', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPrivate(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.findOne(id, false);
	}

	@Get(':id/data/public')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get publicly available information of a user' })
	@ApiOkResponse({ description: 'User data, excepted privates fields (set in the visibility table)', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPublic(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.findOne(id);
	}

	@Get(':id/data/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get visibility settings of a user' })
	@ApiOkResponse({ description: 'User data', type: UserVisibility })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getVisibility(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return (await this.usersService.findVisibilities(id))[0];
	}

	@Patch(':id/data/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update visibility settings of a user' })
	@ApiOkResponse({ description: 'User data', type: UserVisibility })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async updateVisibility(@Param('id') id: number, @Body() input: UserVisibilityPatchDTO) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		const schema = z
			.object({
				email: z.boolean(),
				secondary_email: z.boolean(),
				birth_date: z.boolean(),
				gender: z.boolean(),
				pronouns: z.boolean(),
				promotion: z.boolean(),
				phone: z.boolean(),
				parent_contact: z.boolean(),
			})
			.strict();
		validate(schema, input);

		return this.usersService.updateVisibility(id, input);
	}

	@Get(':id/roles')
	@UseGuards(PermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get roles of a user' })
	@ApiOkResponse({ description: 'Roles of the user', type: [Role] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getUserRoles(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.getUserRoles(id, { show_expired: true, show_revoked: true });
	}

	@Get(':id/permissions')
	@UseGuards(PermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get permissions of a user' })
	@ApiOkResponse({ description: 'Permissions of the user', type: [Permission] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getUserPermissions(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.getUserPermissions(id, { show_expired: true, show_revoked: true });
	}
}
