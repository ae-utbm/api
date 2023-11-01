import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { USER_GENDER } from '@exported/api/constants/genders';
import { ApiNotOkResponses } from '@modules/_mixin/decorators/error.decorator';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { GuardSelfOrPermsOrSub } from '@modules/auth/decorators/self-or-sub-perms.decorator';
import { GuardSelfParam } from '@modules/auth/decorators/self.decorator';
import { CreateUserDTO } from '@modules/auth/dto/post.dto';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { SelfOrPermsOrSubGuard } from '@modules/auth/guards/self-or-sub-or-perms.guard';
import { SelfGuard } from '@modules/auth/guards/self.guard';
import { PermissionGetDTO } from '@modules/permissions/dto/get.dto';
import { TranslateService } from '@modules/translate/translate.service';
import { validate } from '@utils/validate';

import { BaseUserResponseDTO } from '../dto/base-user.dto';
import { UserGetDTO, UserRoleGetDTO, UserVisibilityGetDTO } from '../dto/get.dto';
import { UserPatchDTO, UserVisibilityPatchDTO } from '../dto/patch.dto';
import { Request, User } from '../entities/user.entity';
import { UsersDataService } from '../services/users-data.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersDataController {
	constructor(private readonly usersService: UsersDataService, private readonly t: TranslateService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Creates new users' })
	@ApiOkResponse({ description: 'The created user', type: [BaseUserResponseDTO] })
	@ApiNotOkResponses({ 400: 'Invalid input', 401: 'Insufficient permission' })
	async create(@Body() input: CreateUserDTO[]): Promise<BaseUserResponseDTO[]> {
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
	@ApiOkResponse({ description: 'The updated users', type: UserGetDTO })
	@ApiNotOkResponses({ 400: 'Invalid input', 404: 'User(s) not found' })
	async update(@Req() req: Request, @Body() input: UserPatchDTO[]): Promise<UserGetDTO[]> {
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
				// TODO: (KEY: 1) Make a PR to implement cursus & specialty in the API
				// cursus: z.string().optional(),
				// specialty: z.string().optional(),
				promotion: z.coerce.number().optional(),
			})
			.strict();

		validate(z.array(schema).min(1), input);
		return this.usersService.update((req.user as User).id, input);
	}

	@Delete(':id')
	@UseGuards(SelfGuard)
	@GuardSelfParam('id')
	@ApiOperation({ summary: 'Delete your account' })
	@ApiParam({ name: 'id', description: 'Your user ID' })
	@ApiOkResponse({ description: 'User deleted', type: MessageResponseDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async delete(@Param('id') id: number): Promise<MessageResponseDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.delete(id);
	}

	@Get(':id/data')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get all information of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data', type: UserGetDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getPrivate(@Param('id') id: number): Promise<UserGetDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.findOneAsDTO(id, false);
	}

	@Get(':id/data/public')
	@UseGuards(SelfOrPermsOrSubGuard)
	@GuardSelfOrPermsOrSub('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get publicly available information of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data, excepted privates fields (set in the visibility table)', type: UserGetDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getPublic(@Param('id') id: number): Promise<UserGetDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.findOneAsDTO(id);
	}

	@Get(':id/data/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get visibility settings of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data', type: UserVisibilityGetDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getVisibility(@Param('id') id: number): Promise<UserVisibilityGetDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return (await this.usersService.findVisibilities(id))[0];
	}

	@Patch(':id/data/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update visibility settings of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'User data', type: UserVisibilityGetDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID or input', 404: 'User not found' })
	async updateVisibility(
		@Param('id') id: number,
		@Body() input: UserVisibilityPatchDTO,
	): Promise<UserVisibilityGetDTO> {
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
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER', 'CAN_READ_ROLE'])
	@ApiOperation({ summary: 'Get roles of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'Roles of the user', type: [UserRoleGetDTO] })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getUserRoles(@Param('id') id: number): Promise<UserRoleGetDTO[]> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.getUserRoles(id, { show_expired: true, show_revoked: true });
	}

	@Get(':id/permissions')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER', 'CAN_READ_PERMISSIONS_OF_USER'])
	@ApiOperation({ summary: 'Get permissions of a user' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'Permissions of the user', type: [PermissionGetDTO] })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async getUserPermissions(@Param('id') id: number): Promise<PermissionGetDTO[]> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersService.getUserPermissions(id, { show_expired: true, show_revoked: true });
	}
}
