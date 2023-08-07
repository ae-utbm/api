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
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { toReadable } from '@utils/images';

import { PromotionResponseDTO } from './dto/promotion.dto';
import { Promotion } from './entities/promotion.entity';
import { PromotionsService } from './promotions.service';
import { BaseUserResponseDTO } from '../users/dto/base-user.dto';

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
	@ApiOperation({ summary: 'Get all promotions' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getAll() {
		return this.promotionsService.findAll();
	}

	@Post(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	@ApiConsumes('multipart/form-data')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Update the promotion logo' })
	@ApiNotFoundResponse({ description: 'Promotion not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiBadRequestResponse({ description: 'Invalid file' })
	@ApiOkResponse({ type: Promotion })
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
	async editLogo(@UploadedFile() file: Express.Multer.File, @Param('number') number: number) {
		return this.promotionsService.updateLogo(number, file);
	}

	@Get(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Get the promotion logo' })
	@ApiNotFoundResponse({ description: 'Promotion not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	@ApiNotFoundResponse({ description: 'Promotion not found or promotion has no logo' })
	async getLogo(@Param('number') number: number) {
		const logo = await this.promotionsService.getLogo(number);
		return new StreamableFile(toReadable(logo.path));
	}

	@Delete(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Delete the promotion logo' })
	@ApiNotFoundResponse({ description: 'Promotion not found' })
	@ApiOkResponse({ type: Promotion })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async deleteLogo(@Param('number') number: number) {
		return this.promotionsService.deleteLogo(number);
	}

	@Get(':number')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOkResponse({ type: PromotionResponseDTO })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Get the specified promotion' })
	@ApiNotFoundResponse({ description: 'Promotion not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async get(@Param('number') number: number) {
		return this.promotionsService.findOne(number);
	}

	@Get(':number/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Get users of the specified promotions' })
	@ApiNotFoundResponse({ description: 'Promotion not found' })
	@ApiUnauthorizedResponse({ description: 'Insufficient permission' })
	async getUsers(@Param('number') number: number) {
		return this.promotionsService.getUsers(number);
	}
}
