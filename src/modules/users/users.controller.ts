import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { getStreamableFile } from '@utils/images';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
	Controller,
	Delete,
	Get,
	Param,
	Post,
	StreamableFile,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';

import { PermissionOrSelfGuardREST } from '@modules/auth/guards/self.guard';
import { Permissions } from '@modules/auth/decorators/perms.decorator';
import { Self } from '@modules/auth/decorators/self.decorator';
import { PermissionGuardREST } from '@modules/auth/guards/perms.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('picture/:id')
	@UseGuards(PermissionOrSelfGuardREST)
	@Self('id')
	@Permissions('CAN_UPDATE_USER')
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

	@Get('picture/:id')
	@UseGuards(PermissionOrSelfGuardREST)
	@Self('id')
	@Permissions('CAN_READ_USER_PUBLIC')
	async getPicture(@Param('id') id: number) {
		const picture = await this.usersService.getPicture(id);
		return new StreamableFile(getStreamableFile(picture.path));
	}

	@Delete('picture/:id')
	@UseGuards(PermissionGuardREST)
	@Permissions('CAN_UPDATE_USER')
	async deletePicture(@Param('id') id: number) {
		return this.usersService.deletePicture(id);
	}

	@Post('banner/:id')
	@UseGuards(PermissionOrSelfGuardREST)
	@Self('id')
	@Permissions('CAN_UPDATE_USER')
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

	@Get('banner/:id')
	@UseGuards(PermissionOrSelfGuardREST)
	@Self('id')
	@Permissions('CAN_READ_USER_PUBLIC')
	async getBanner(@Param('id') id: number) {
		const banner = await this.usersService.getBanner(id);
		return new StreamableFile(getStreamableFile(banner.path));
	}

	@Delete('banner/:id')
	@UseGuards(PermissionOrSelfGuardREST)
	@Self('id')
	@Permissions('CAN_UPDATE_USER')
	async deleteBanner(@Param('id') id: number) {
		return this.usersService.deleteBanner(id);
	}
}
