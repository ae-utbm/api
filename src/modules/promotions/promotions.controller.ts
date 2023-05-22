import { Controller, Delete, Get, Param, Post, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { getStreamableFile } from '@utils/images';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

// TODO: Add guards and decorators to the controller

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
	constructor(private readonly promotionsService: PromotionsService) {}

	// CAN_EDIT_PROMOTION
	// todo: should check that user is admin or president of the promotion
	@Post('logo/:id')
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
	async editLogo(@UploadedFile() file: Express.Multer.File, @Param('id') id: number) {
		return this.promotionsService.updateLogo({ id, file });
	}

	// CAN_VIEW_PROMOTION
	@Get('logo/:id')
	async getLogo(@Param('id') id: number) {
		const logo = await this.promotionsService.getLogo(id);
		return new StreamableFile(getStreamableFile(logo.path));
	}

	// CAN_EDIT_PROMOTION
	// todo: same as above
	@Delete('logo/:id')
	async deleteLogo(@Param('id') id: number) {
		return this.promotionsService.deleteLogo(id);
	}
}
