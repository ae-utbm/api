import { Controller, Delete, Get, Param, Post, Req, UploadedFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { GuardPermissions } from '@modules/auth/decorators/permissions.decorator';
import { GuardSelfOrPermissions } from '@modules/auth/decorators/self-or-perms.decorator';
import { PermissionGuard } from '@modules/auth/guards/permission.guard';
import { SelfOrPermissionGuard } from '@modules/auth/guards/self-or-perms.guard';
import { ApiNotOkResponses } from '@modules/base/decorators/api-not-ok.decorator';
import { InputIdParamDTO } from '@modules/base/dto/input.dto';
import { OutputMessageDTO } from '@modules/base/dto/output.dto';
import { i18nBadRequestException } from '@modules/base/http-errors';
import { ApiDownloadFile } from '@modules/files/decorators/download.decorator';
import { ApiUploadFile } from '@modules/files/decorators/upload.decorator';
import { OutputFileDTO } from '@modules/files/dto/output.dto';
import { FilesService } from '@modules/files/files.service';

import { Request } from '../entities/user.entity';
import { UsersFilesService } from '../services/users-files.service';

@ApiTags('Users Files')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersFilesController {
	constructor(private readonly usersFilesService: UsersFilesService, private readonly filesService: FilesService) {}

	@Post(':id/picture')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update user profile picture' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'The updated user picture', type: OutputFileDTO })
	@ApiNotOkResponses({ 400: 'Invalid user ID or missing uploaded file', 404: 'User not found' })
	@ApiUploadFile()
	async editPicture(
		@Req() req: Request,
		@Param() params: InputIdParamDTO,
		@UploadedFile() file: Express.Multer.File,
	): Promise<OutputFileDTO> {
		if (!file) throw new i18nBadRequestException('validations.file.invalid.not_provided');
		return this.usersFilesService.updatePicture(req.user, params.id, file);
	}

	@Delete(':id/picture')
	@UseGuards(PermissionGuard)
	@GuardPermissions('CAN_EDIT_USER')
	@ApiOperation({ summary: 'Delete user profile picture' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ type: OutputMessageDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async deletePicture(@Param() params: InputIdParamDTO): Promise<OutputMessageDTO> {
		return this.usersFilesService.deletePicture(params.id);
	}

	@Get(':id/picture')
	@ApiOperation({ summary: 'Get user profile picture' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	@ApiDownloadFile()
	async getPicture(@Req() req: Request, @Param() params: InputIdParamDTO) {
		const picture = await this.usersFilesService.getPicture(params.id);
		return this.filesService.getAsStreamable(picture, req.user.id);
	}

	@Post(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Update user profile banner' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ description: 'The updated user banner', type: OutputFileDTO })
	@ApiNotOkResponses({ 400: 'Invalid user ID or missing uploaded file', 404: 'User not found' })
	@ApiUploadFile()
	async editBanner(
		@Param() params: InputIdParamDTO,
		@UploadedFile() file: Express.Multer.File,
	): Promise<OutputFileDTO> {
		if (!file) throw new i18nBadRequestException('validations.file.invalid.not_provided');
		return this.usersFilesService.updateBanner(params.id, file);
	}

	@Delete(':id/banner')
	@UseGuards(SelfOrPermissionGuard)
	@GuardSelfOrPermissions('id', ['CAN_EDIT_USER'])
	@ApiOperation({ summary: 'Delete user profile banner' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiOkResponse({ type: OutputMessageDTO })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	async deleteBanner(@Param() params: InputIdParamDTO): Promise<OutputMessageDTO> {
		return this.usersFilesService.deleteBanner(params.id);
	}

	@Get(':id/banner')
	@ApiOperation({ summary: 'Get user profile banner' })
	@ApiParam({ name: 'id', description: 'The user ID' })
	@ApiNotOkResponses({ 400: 'Invalid ID', 404: 'User not found' })
	@ApiDownloadFile()
	async getBanner(@Req() req: Request, @Param() params: InputIdParamDTO) {
		const banner = await this.usersFilesService.getBanner(params.id);
		return this.filesService.getAsStreamable(banner, req.user.id);
	}
}
