import type {
	InputUpdateRoleDto,
	InputUpdateRoleUserDto,
	InputCreateRoleDto,
	PERMISSION_NAMES,
	I18nTranslations,
	InputUpdateRoleUsersDto,
	InputDeleteRoleUsersDto,
} from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, IsEnum, IsUppercase, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { I18nIsDate, I18nIsId, I18nIsString } from '@modules/base/decorators';

export class InputCreateRoleDTO implements InputCreateRoleDto {
	@ApiProperty({ type: String, example: 'AE_ADMINS' })
	@I18nIsString()
	@IsUppercase({ message: i18nValidationMessage<I18nTranslations>('validations.string.invalid.uppercase') })
	name: Uppercase<string>;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsEnum(PERMISSIONS_NAMES, {
		each: true,
		message: i18nValidationMessage<I18nTranslations>('validations.permission.invalid.format', {
			permissions: PERMISSIONS_NAMES.join("', '"),
		}),
	})
	@ArrayUnique({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.duplicate') })
	@ArrayNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.not_empty') })
	permissions: PERMISSION_NAMES[];
}

export class InputUpdateRoleDTO extends InputCreateRoleDTO implements InputUpdateRoleDto {
	@ApiProperty({ required: true, minimum: 1 })
	@I18nIsId()
	id: number;
}

export class InputUpdateRoleUserDTO implements InputUpdateRoleUserDto {
	@ApiProperty({ required: true, minimum: 1 })
	@I18nIsId()
	id: number;

	@ApiProperty({ required: true })
	@I18nIsDate()
	expires: Date;
}

export class InputUpdateRoleUsersDTO implements InputUpdateRoleUsersDto {
	@ApiProperty({ type: InputUpdateRoleUserDTO, isArray: true })
	@ArrayNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.not_empty') })
	@ArrayUnique({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.duplicate') })
	@ValidateNested({
		each: true,
		message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.format', {
			type: InputUpdateRoleUserDTO.name,
		}),
	})
	@Type(() => InputUpdateRoleUserDTO)
	users: InputUpdateRoleUserDTO[];
}

export class InputDeleteRoleUsersDTO implements InputDeleteRoleUsersDto {
	@ApiProperty({ isArray: true, type: Number })
	@ArrayNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.not_empty') })
	@I18nIsId({ each: true })
	users: number[];
}
