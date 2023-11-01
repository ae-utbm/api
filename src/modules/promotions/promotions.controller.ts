import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	StreamableFile,
	UploadedFile,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/error.decorator';
import { MessageResponseDTO } from '@modules/_mixin/dto/message.dto';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { ApiDownloadFile } from '@modules/files/decorators/download.decorator';
import { ApiUploadFile } from '@modules/files/decorators/upload.decorator';
import { FilesService } from '@modules/files/files.service';
import { TranslateService } from '@modules/translate/translate.service';
import { validate } from '@utils/validate';

import { PromotionResponseDTO } from './dto/get.dto';
import { Promotion } from './entities/promotion.entity';
import { PromotionsService } from './promotions.service';
import { BaseUserResponseDTO } from '../users/dto/base-user.dto';

@ApiTags('Promotions')
@Controller('promotions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PromotionsController {
	constructor(
		private readonly promotionsService: PromotionsService,
		private readonly filesService: FilesService,
		private readonly t: TranslateService,
	) {}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get all existing promotions' })
	@ApiOkResponse({ type: [PromotionResponseDTO] })
	async getAll(): Promise<PromotionResponseDTO[]> {
		return this.promotionsService.findAll();
	}

	@Get('latest')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get the latest promotion that has been created' })
	@ApiOkResponse({ type: PromotionResponseDTO })
	async getLatest(): Promise<PromotionResponseDTO> {
		return this.promotionsService.findLatest();
	}

	@Get('current')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get promotions currently active' })
	@ApiOkResponse({ type: [PromotionResponseDTO] })
	async getCurrent(): Promise<PromotionResponseDTO[]> {
		return this.promotionsService.findCurrent();
	}

	@Post(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	@ApiOperation({ summary: 'Update the promotion logo' })
	@ApiUploadFile()
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOkResponse({ type: PromotionResponseDTO })
	@ApiNotOkResponses({ 400: 'Invalid file', 404: 'Promotion not found' })
	async editLogo(@UploadedFile() file: Express.Multer.File, @Param('number') number: number) {
		if (!file) throw new BadRequestException(this.t.Errors.File.NotProvided());
		validate(z.coerce.number().int().min(1), number, this.t.Errors.Id.Invalid(Promotion, number));

		return this.promotionsService.updateLogo(number, file);
	}

	@Get(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get the promotion logo' })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiDownloadFile('The promotion logo')
	@ApiNotOkResponses({ 404: 'Promotion not found or promotion has no logo' })
	async getLogo(@Param('number') number: number) {
		validate(z.coerce.number().int().min(1), number, this.t.Errors.Id.Invalid(Promotion, number));

		const logo = await this.promotionsService.getLogo(number);
		return new StreamableFile(this.filesService.toReadable(logo));
	}

	@Delete(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Delete the promotion logo' })
	@ApiOkResponse({ type: MessageResponseDTO })
	@ApiNotOkResponses({ 404: 'Promotion not found or promotion has no logo' })
	async deleteLogo(@Param('number') number: number) {
		validate(z.coerce.number().int().min(1), number, this.t.Errors.Id.Invalid(Promotion, number));

		return this.promotionsService.deleteLogo(number);
	}

	@Get(':number')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get the specified promotion' })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOkResponse({ type: PromotionResponseDTO })
	@ApiNotOkResponses({ 404: 'Promotion not found' })
	async get(@Param('number') number: number) {
		validate(z.coerce.number().int().min(1), number, this.t.Errors.Id.Invalid(Promotion, number));

		return this.promotionsService.findOne(number);
	}

	@Get(':number/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Get users of the specified promotions' })
	@ApiOkResponse({ type: [BaseUserResponseDTO] })
	@ApiNotOkResponses({ 404: 'Promotion not found' })
	async getUsers(@Param('number') number: number) {
		validate(z.coerce.number().int().min(1), number, this.t.Errors.Id.Invalid(Promotion, number));

		return this.promotionsService.getUsers(number);
	}
}
