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
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';

import { ErrorResponseDTO } from '@modules/_mixin/dto/error.dto';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { GuardSelfOrPermsOrSub } from '@modules/auth/decorators/self-or-sub-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { SelfOrPermsOrSubGuard } from '@modules/auth/guards/self-or-sub-or-perms.guard';
import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';
import { validate } from '@utils/validate';

import { UserGetBannerDTO, UserGetPictureDTO } from '../dto/get.dto';
import { RequestWithUser, User } from '../entities/user.entity';
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
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'The updated user picture', type: UserGetPictureDTO })
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
	async editPicture(
		@Req() req: RequestWithUser,
		@UploadedFile() file: Express.Multer.File,
		@Param('id') id: number,
	): Promise<UserGetPictureDTO> {
		if (!file) throw new BadRequestException(this.t.Errors.File.NotProvided());
		validate(z.coerce.number().int().min(1), id);

		return this.usersFilesService.updatePicture(req.user, id, file);
	}

	@Delete(':id/picture')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Delete user profile picture' })
	@ApiOkResponse({ type: MessageResponseDTO })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	async deletePicture(@Param('id') id: number): Promise<MessageResponseDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersFilesService.deletePicture(id);
	}

	@Get(':id/picture')
	@UseGuards(SelfOrPermsOrSubGuard)
	@GuardSelfOrPermsOrSub('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get user profile picture' })
	@ApiOkResponse({ description: 'The user picture', type: ArrayBuffer })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	async getPicture(@Req() req: RequestWithUser, @Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		const picture = await this.usersFilesService.getPicture(id);
		await picture.visibility?.init();

		if (await this.filesService.canReadFile(picture, req.user))
			return new StreamableFile(this.filesService.toReadable(picture));

		// Should not happen unless the user is subscribed but not in the visibility group of subscribers
		// -> all others options are caught by the guard
		/* istanbul ignore next-line */
		throw new UnauthorizedException(this.t.Errors.File.Unauthorized(picture.visibility?.name));
	}

	@Post(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update user profile banner' })
	@ApiOkResponse({ description: 'The updated user banner', type: UserGetBannerDTO })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
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
	async editBanner(@UploadedFile() file: Express.Multer.File, @Param('id') id: number): Promise<UserGetBannerDTO> {
		if (!file) throw new BadRequestException(this.t.Errors.File.NotProvided());
		validate(z.coerce.number().int().min(1), id);

		return this.usersFilesService.updateBanner(id, file);
	}

	@Delete(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Delete user profile banner' })
	@ApiOkResponse({ type: MessageResponseDTO })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	async deleteBanner(@Param('id') id: number): Promise<MessageResponseDTO> {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid(User, id));

		return this.usersFilesService.deleteBanner(id);
	}

	@Get(':id/banner')
	@UseGuards(SelfOrPermsOrSubGuard)
	@GuardSelfOrPermsOrSub('id', ['CAN_READ_USER'])
	@ApiOperation({ summary: 'Get user profile banner' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission', type: ErrorResponseDTO })
	@ApiOkResponse({ description: 'The user banner', type: ArrayBuffer })
	async getBanner(@Req() req: RequestWithUser, @Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id);

		const banner = await this.usersFilesService.getBanner(id);
		await banner.visibility?.init();

		if (await this.filesService.canReadFile(banner, req.user))
			return new StreamableFile(this.filesService.toReadable(banner));

		// Should not happen unless the user is subscribed but not in the visibility group of subscribers
		// -> all others options are caught by the guard
		/* istanbul ignore next-line */
		throw new UnauthorizedException(this.t.Errors.File.Unauthorized(banner.visibility?.name));
	}
}
