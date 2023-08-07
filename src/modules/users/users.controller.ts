import type { Request } from 'express';

import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Req,
	StreamableFile,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { UserPostByAdminDTO } from '@modules/auth/dto/register.dto';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { Role } from '@modules/roles/entities/role.entity';
import { toReadable } from '@utils/images';

import { UserPatchDTO } from './dto/patch.dto';
import { UserVisibility } from './entities/user-visibility.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Create a new user' })
	@ApiOkResponse({ description: 'The created user', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async create(@Body() input: UserPostByAdminDTO) {
		return this.usersService.registerByAdmin(input);
	}

	@Patch()
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update an existing user' })
	@ApiOkResponse({ description: 'The updated user', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async update(@Body() input: UserPatchDTO, @Req() req: Request & { user: User }) {
		return this.usersService.update(req.user.id, input);
	}

	@Delete(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_DELETE_USER'])
	@ApiOperation({ summary: 'Delete a user' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async delete(@Param('id') id: number) {
		return this.usersService.delete(id);
	}

	@Get(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get public information of a user' })
	@ApiOkResponse({ description: 'User data, excepted privates fields (set in the visibility table)', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async get(@Param('id') id: number) {
		return this.usersService.findOne({ id });
	}

	@Get(':id/private')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get information of a user' })
	@ApiOkResponse({ description: 'User data', type: User })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getAsPrivate(@Param('id') id: number) {
		return this.usersService.findOne({ id }, false);
	}

	@Get(':id/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	@ApiOperation({ summary: 'Get visibility of a user' })
	@ApiOkResponse({ description: 'User data', type: UserVisibility })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getVisibility(@Param('id') id: number) {
		return this.usersService.findVisibility({ id });
	}

	@Post(':id/picture')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@UseInterceptors(FileInterceptor('file'))
	async editPicture(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.usersService.updatePicture({ id, file });
	}

	@Delete(':id/picture')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Delete user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deletePicture(@Param('id') id: number) {
		return this.usersService.deletePicture(id);
	}

	@Get(':id/picture')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPicture(@Param('id') id: number) {
		const picture = await this.usersService.getPicture(id);
		return new StreamableFile(toReadable(picture.path));
	}

	@Post(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@UseInterceptors(FileInterceptor('file'))
	async editBanner(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.usersService.updateBanner({ id, file });
	}

	@Delete(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Delete user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deleteBanner(@Param('id') id: number) {
		return this.usersService.deleteBanner(id);
	}

	@Get(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Get user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getBanner(@Param('id') id: number) {
		const banner = await this.usersService.getBanner(id);
		return new StreamableFile(toReadable(banner.path));
	}

	@Get(':id/roles')
	@UseGuards(PermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get roles of a user' })
	@ApiOkResponse({ description: 'Roles of the user', type: [Role] })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getRoleUsers(@Param('id') id: number) {
		return this.usersService.getUserRoles(id, { show_expired: true, show_revoked: true });
	}
}
