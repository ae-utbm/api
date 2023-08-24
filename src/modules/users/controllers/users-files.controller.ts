import type { I18nTranslations, RequestWithUser } from '@types';

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
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { FilesService } from '@modules/files/files.service';

import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@ApiTags('Users Files')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersFilesController {
	constructor(
		private readonly usersService: UsersService,
		private readonly filesService: FilesService,
		private readonly i18n: I18nService<I18nTranslations>,
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
	async editPicture(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		if (!file) throw new BadRequestException(Errors.File.NotProvided({ i18n: this.i18n }));

		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.usersService.updatePicture(id, file);
	}

	@Delete(':id/picture')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Delete user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deletePicture(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.usersService.deletePicture(id);
	}

	@Get(':id/picture')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get user profile picture' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getPicture(@Req() req: RequestWithUser, @Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		const picture = await this.usersService.getPicture(id);

		if (await this.filesService.canReadFile(picture, req.user as User))
			return new StreamableFile(this.filesService.toReadable(picture));

		throw new UnauthorizedException();
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
		if (!file) throw new BadRequestException(Errors.File.NotProvided({ i18n: this.i18n }));

		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.usersService.updateBanner(id, file);
	}

	@Delete(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Delete user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deleteBanner(@Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		return this.usersService.deleteBanner(id);
	}

	@Get(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Get user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getBanner(@Req() req: RequestWithUser, @Param('id') id: number) {
		if (typeof id !== 'number' && parseInt(id, 10) != id)
			throw new BadRequestException(Errors.Generic.FieldInvalid({ i18n: this.i18n, type: Number, field: 'id' }));

		const banner = await this.usersService.getBanner(id);

		if (await this.filesService.canReadFile(banner, req.user as User))
			return new StreamableFile(this.filesService.toReadable(banner));

		throw new UnauthorizedException();
	}
}
