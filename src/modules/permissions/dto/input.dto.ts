import type {
	InputUpdatePermissionDto,
	PERMISSION_NAMES,
	InputCreatePermissionDto,
	I18nTranslations,
} from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { I18nIsDate, I18nIsId, I18nIsBoolean } from '@modules/_mixin/decorators';

export class InputCreatePermissionDTO implements InputCreatePermissionDto {
	@ApiProperty()
	@I18nIsId()
	id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsIn(PERMISSIONS_NAMES, {
		message: i18nValidationMessage<I18nTranslations>('validations.permission.invalid.format', {
			permissions: PERMISSIONS_NAMES.join("', '"),
		}),
	})
	permission: PERMISSION_NAMES;

	@ApiProperty()
	@I18nIsDate()
	expires: Date;
}

export class InputUpdatePermissionDTO implements InputUpdatePermissionDto {
	@ApiProperty({ required: true, minimum: 1 })
	@I18nIsId()
	id: number;

	@ApiProperty({ required: true, minimum: 1 })
	@I18nIsId()
	user_id: number;

	@ApiProperty({ enum: PERMISSIONS_NAMES })
	@IsIn(PERMISSIONS_NAMES, {
		message: i18nValidationMessage<I18nTranslations>('validations.permission.invalid.format', {
			permissions: PERMISSIONS_NAMES.join("', '"),
		}),
	})
	name: PERMISSION_NAMES;

	@ApiProperty()
	@I18nIsDate()
	expires: Date;

	@ApiProperty()
	@I18nIsBoolean()
	revoked: boolean;
}
