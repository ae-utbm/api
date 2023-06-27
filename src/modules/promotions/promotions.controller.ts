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

import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { getStreamableFile } from '@utils/images';
import { PromotionsService } from './promotions.service';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { PromotionResponseDTO } from './dto/promotion.dto';
import { PromotionUsersResponseDTO } from './dto/promotion-users.dto';

@ApiTags('Promotions')
@Controller('promotions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PromotionsController {
	constructor(private readonly promotionsService: PromotionsService) {}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOkResponse({ type: [PromotionResponseDTO] })
	async getAll() {
		return this.promotionsService.findAll();
	}

	@Get('latest')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOkResponse({ type: PromotionResponseDTO })
	async getLatest() {
		return this.promotionsService.findLatest();
	}

	@Post('logo/:id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
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

	@Get('logo/:id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	async getLogo(@Param('id') id: number) {
		const logo = await this.promotionsService.getLogo(id);
		return new StreamableFile(getStreamableFile(logo.path));
	}

	@Delete('logo/:id')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	async deleteLogo(@Param('id') id: number) {
		return this.promotionsService.deleteLogo(id);
	}

	@Get(':number')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOkResponse({ type: PromotionResponseDTO })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	async get(@Param('number') number: number) {
		return this.promotionsService.findOne(number);
	}

	@Get(':number/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_VIEW_USERS_IN_PROMOTION')
	@ApiOkResponse({ type: [PromotionUsersResponseDTO] })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	async getUsers(@Param('number') number: number) {
		return this.promotionsService.getUsers(number);
	}
}
