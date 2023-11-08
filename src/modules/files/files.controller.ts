import type { RequestWithUser } from '#types/api';

import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { validate } from '@utils/validate';

import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FilesController {
	constructor(private readonly filesService: FilesService, private readonly t: TranslateService) {}

	@Get(':id/data')
	async getFile(@Req() req: RequestWithUser, @Param('id') id: number) {
		validate(z.coerce.number().int().min(1), id, this.t.Errors.Id.Invalid('File', id));

		const file = await this.filesService.findOne(id);
		await file.visibility?.init();

		if (await this.filesService.canReadFile(file, req.user as User)) return file.toObject();
		throw new UnauthorizedException(this.t.Errors.File.Unauthorized(file.visibility?.name));
	}
}
