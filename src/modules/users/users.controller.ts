import { Controller, Delete, Get, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { getStreamableFile } from '@utils/images';

// TODO: Add guards and decorators to the controller

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	// SELF OR EDIT_USER
	@Post('picture/:id')
	@UseInterceptors(FileInterceptor('file'))
	async editPicture(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.usersService.updatePicture({ id, file });
	}

	// SELF OR VIEW_USER
	@Get('picture/:id')
	async getPicture(@Param('id') id: number) {
		const picture = await this.usersService.getPicture(id);
		return new StreamableFile(getStreamableFile(picture.path));
	}

	// EDIT_USER
	@Delete('picture/:id')
	async deletePicture(@Param('id') id: number) {
		return this.usersService.deletePicture(id);
	}

	// SELF OR EDIT_USER
	@Post('banner/:id')
	@UseInterceptors(FileInterceptor('file'))
	async editBanner(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.usersService.updateBanner({ id, file });
	}

	// SELF OR VIEW_USER
	@Get('banner/:id')
	async getBanner(@Param('id') id: number) {
		const banner = await this.usersService.getBanner(id);
		return new StreamableFile(getStreamableFile(banner.path));
	}

	// SELF OR EDIT_USER
	@Delete('banner/:id')
	async deleteBanner(@Param('id') id: number) {
		return this.usersService.deleteBanner(id);
	}
}
