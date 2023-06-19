import type { Request } from '@types';

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

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { UserPatchDTO } from './dto/patch.dto';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { UserPostByAdminDTO } from '@modules/auth/dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { getStreamableFile } from '@utils/images';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_CREATE_USER')
	async create(@Body() input: UserPostByAdminDTO) {
		return this.usersService.registerByAdmin(input);
	}

	@Patch()
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_UPDATE_USER'])
	async update(@Body() input: UserPatchDTO, @Req() req: Request) {
		return this.usersService.update(req.user.id, input);
	}

	@Delete(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_DELETE_USER'])
	async delete(@Param('id') id: number) {
		return this.usersService.delete(id);
	}

	@Get(':id')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PUBLIC'])
	async get(@Param('id') id: number) {
		return this.usersService.findOne({ id });
	}

	@Get(':id/private')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	async getAsPrivate(@Param('id') id: number) {
		return this.usersService.findOne({ id }, false);
	}

	@Get(':id/visibility')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PRIVATE'])
	async getVisibility(@Param('id') id: number) {
		return this.usersService.findVisibility({ id });
	}

	@Post(':id/picture')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_UPDATE_USER'])
	@ApiBearerAuth()
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
	@GuardPermissions('CAN_UPDATE_USER')
	@ApiBearerAuth()
	async deletePicture(@Param('id') id: number) {
		return this.usersService.deletePicture(id);
	}

	@Get(':id/picture')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER_PUBLIC'])
	@ApiBearerAuth()
	async getPicture(@Param('id') id: number) {
		const picture = await this.usersService.getPicture(id);
		return new StreamableFile(getStreamableFile(picture.path));
	}

	@Post(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_UPDATE_USER'])
	@ApiBearerAuth()
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
	@GuardSelfOrPermissions('id', ['CAN_UPDATE_USER'])
	@ApiBearerAuth()
	async deleteBanner(@Param('id') id: number) {
		return this.usersService.deleteBanner(id);
	}

	@Get(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_UPDATE_USER'])
	@ApiBearerAuth()
	async getBanner(@Param('id') id: number) {
		const banner = await this.usersService.getBanner(id);
		return new StreamableFile(getStreamableFile(banner.path));
	}

	@Get(':id/roles')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_VIEW_USER_ROLES')
	async getRoleUsers(@Param('id') id: number) {
		return this.usersService.getUserRoles(id, { show_expired: true, show_revoked: true });
	}
}
