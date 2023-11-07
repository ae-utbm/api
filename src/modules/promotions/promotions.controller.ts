import { Controller, Delete, Get, Param, Post, Req, UploadedFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiNotOkResponses } from '@modules/_mixin/decorators/api-not-ok.decorator';
import { OutputMessageDTO } from '@modules/_mixin/dto/output.dto';
import { i18nBadRequestException } from '@modules/_mixin/http-errors';
import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { ApiDownloadFile } from '@modules/files/decorators/download.decorator';
import { ApiUploadFile } from '@modules/files/decorators/upload.decorator';
import { FilesService } from '@modules/files/files.service';
import { Request } from '@modules/users/entities/user.entity';

import { InputPromotionNumberParamDTO } from './dto/input.dto';
import { OutputPromotionDTO } from './dto/output.dto';
import { PromotionsService } from './promotions.service';
import { OutputBaseUserDTO } from '../users/dto/output.dto';

@ApiTags('Promotions')
@Controller('promotions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PromotionsController {
	constructor(private readonly promotionsService: PromotionsService, private readonly filesService: FilesService) {}

	@Get()
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get all existing promotions' })
	@ApiOkResponse({ type: [OutputPromotionDTO] })
	async getAll(): Promise<OutputPromotionDTO[]> {
		return this.promotionsService.findAll();
	}

	@Get('latest')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get the latest promotion that has been created' })
	@ApiOkResponse({ type: OutputPromotionDTO })
	async getLatest(): Promise<OutputPromotionDTO> {
		return this.promotionsService.findLatest();
	}

	@Get('current')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get promotions currently active' })
	@ApiOkResponse({ type: [OutputPromotionDTO] })
	async getCurrent(): Promise<OutputPromotionDTO[]> {
		return this.promotionsService.findCurrent();
	}

	@Post(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	@ApiOperation({ summary: 'Update the promotion logo' })
	@ApiUploadFile()
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOkResponse({ type: OutputPromotionDTO })
	@ApiNotOkResponses({ 400: 'Invalid file', 404: 'Promotion not found' })
	async editLogo(@UploadedFile() file: Express.Multer.File, @Param() params: InputPromotionNumberParamDTO) {
		if (!file) throw new i18nBadRequestException('validations.file.invalid.not_provided');

		return this.promotionsService.updateLogo(params.number, file);
	}

	@Get(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get the promotion logo' })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiDownloadFile('The promotion logo')
	@ApiNotOkResponses({ 404: 'Promotion not found or promotion has no logo' })
	async getLogo(@Req() req: Request, @Param() params: InputPromotionNumberParamDTO) {
		const logo = await this.promotionsService.getLogo(params.number);
		return this.filesService.getAsStreamable(logo, req.user.id);
	}

	@Delete(':number/logo')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_PROMOTION')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Delete the promotion logo' })
	@ApiOkResponse({ type: OutputMessageDTO })
	@ApiNotOkResponses({ 404: 'Promotion not found or promotion has no logo' })
	async deleteLogo(@Param() params: InputPromotionNumberParamDTO) {
		return this.promotionsService.deleteLogo(params.number);
	}

	@Get(':number')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiOperation({ summary: 'Get the specified promotion' })
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOkResponse({ type: OutputPromotionDTO })
	@ApiNotOkResponses({ 404: 'Promotion not found' })
	async get(@Param() params: InputPromotionNumberParamDTO) {
		return this.promotionsService.findOne(params.number);
	}

	@Get(':number/users')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_READ_PROMOTION')
	@ApiParam({ name: 'number', description: 'The promotion number (eg: 21)' })
	@ApiOperation({ summary: 'Get users of the specified promotions' })
	@ApiOkResponse({ type: [OutputBaseUserDTO] })
	@ApiNotOkResponses({ 404: 'Promotion not found' })
	async getUsers(@Param() params: InputPromotionNumberParamDTO) {
		return this.promotionsService.getUsers(params.number);
	}
}
