import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/base/decorators';
import { InputIdParamDTO } from '@modules/base/dto/input.dto';
import { Request } from '@modules/users/entities/user.entity';

import { OutputFileDTO } from './dto/output.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@Controller('files')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FilesController {
	constructor(private readonly filesService: FilesService) {}

	@Get(':id/data')
	@ApiOperation({ summary: 'Get file data' })
	@ApiParam({ name: 'id', description: 'The file ID' })
	@ApiOkResponse({ type: OutputFileDTO })
	@ApiNotOkResponses({
		400: 'Invalid ID',
		401: 'Not in file visibility group',
		404: 'File not found',
	})
	async getFile(@Req() req: Request, @Param() params: InputIdParamDTO): Promise<OutputFileDTO> {
		const file = await this.filesService.findOne(params.id);
		return this.filesService.getAsData(file, req.user.id);
	}
}
