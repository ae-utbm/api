import type { RequestWithUser } from '#types/api';

import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Req,
	StreamableFile,
	UnauthorizedException,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { z } from 'zod';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { GuardSelfOrPermsOrSub } from '@modules/auth/decorators/self-or-sub-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { SelfOrPermsOrSubGuard } from '@modules/auth/guards/self-or-sub-or-perms.guard';
import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';
import { validate } from '@utils/validate';

import { User } from '../entities/user.entity';
import { UsersFilesService } from '../services/users-files.service';

@ApiTags('Users Files')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersFilesController {
	constructor(
		private readonly t: TranslateService,
		private readonly usersFilesService: UsersFilesService,
		private readonly filesService: FilesService,
	) {}

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
	async editPicture(@Req() req: RequestWithUser, @UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		if (!file) throw new BadRequestException(this.t.Errors.File.NotProvided());
		validate(z.coerce.number().int().min(1), id);

		return this.usersFilesService.updatePicture(req.user as User, id, file);
	}

	@Delete(':id/picture')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Delete user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deletePicture(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		return this.usersFilesService.deletePicture(id);
	}

	@Get(':id/picture')
	@UseGuards(SelfOrPermsOrSubGuard)
	@GuardSelfOrPermsOrSub('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPicture(@Req() req: RequestWithUser, @Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		const picture = await this.usersFilesService.getPicture(id);
		await picture.visibility?.init();

		if (await this.filesService.canReadFile(picture, req.user as User))
			return new StreamableFile(this.filesService.toReadable(picture));

		throw new UnauthorizedException(this.t.Errors.File.Unauthorized(picture.visibility?.name));
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
		if (!file) throw new BadRequestException(this.t.Errors.File.NotProvided());
		validate(z.coerce.number().int().min(1), id);

		return this.usersFilesService.updateBanner(id, file);
	}

	@Delete(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Delete user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deleteBanner(@Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		return this.usersFilesService.deleteBanner(id);
	}

	@Get(':id/banner')
	@UseGuards(SelfOrPermsOrSubGuard)
	@GuardSelfOrPermsOrSub('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getBanner(@Req() req: RequestWithUser, @Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		const banner = await this.usersFilesService.getBanner(id);
		await banner.visibility?.init();

		if (await this.filesService.canReadFile(banner, req.user as User))
			return new StreamableFile(this.filesService.toReadable(banner));

		throw new UnauthorizedException(this.t.Errors.File.Unauthorized(banner.visibility?.name));
	}
}
