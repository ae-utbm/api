import { Controller, Get, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { createReadStream } from 'fs';

// TODO: Add guards and decorators to the controller

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('picture/:id')
	@UseInterceptors(FileInterceptor('file'))
	async editPicture(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.usersService.updatePicture({ id, file });
	}

	@Get('picture/:id')
	async getPicture(@Param('id') id: number) {
		// TODO: add a fallback if the picture is requested while being edited
		// ! because if the picture is being edited, it will be deleted and the request will fail

		const picture = await this.usersService.getPicture(id);
		return new StreamableFile(createReadStream(picture.path));
	}

	@Post('banner/:id')
	@UseInterceptors(FileInterceptor('file'))
	async editBanner(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.usersService.updateBanner({ id, file });
	}

	@Get('banner/:id')
	async getBanner(@Param('id') id: number) {
		// TODO: add a fallback if the picture is requested while being edited
		// ! because if the picture is being edited, it will be deleted and the request will fail

		const banner = await this.usersService.getBanner(id);
		return new StreamableFile(createReadStream(banner.path));
	}
}