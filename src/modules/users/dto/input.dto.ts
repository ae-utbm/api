import type { email } from '#types';
import type { GENDERS, InputUpdateUserVisibilityDto, InputUpdateUserDto, I18nTranslations } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { USER_GENDER } from '@exported/api/constants/genders';
import {
	I18nIsBoolean,
	I18nIsDate,
	I18nIsEmail,
	I18nIsId,
	I18nIsPhoneNumber,
	I18nIsString,
} from '@modules/_mixin/decorators';

export class InputUpdateUserDTO implements InputUpdateUserDto {
	@ApiProperty({ required: false })
	@I18nIsEmail()
	@IsOptional()
	email?: email;

	@ApiProperty({ required: false })
	@I18nIsDate()
	@IsOptional()
	birth_date?: Date;

	@ApiProperty({ required: false })
	@I18nIsString()
	@IsOptional()
	first_name?: string;

	@ApiProperty({ required: false })
	@I18nIsString()
	@IsOptional()
	last_name?: string;

	@ApiProperty({ required: false })
	@IsIn(USER_GENDER, {
		message: i18nValidationMessage<I18nTranslations>('validations.gender.invalid.format', {
			genders: USER_GENDER.join("', '"),
		}),
	})
	@IsOptional()
	gender?: GENDERS;

	@ApiProperty({ required: false })
	@I18nIsString()
	@IsOptional()
	pronouns?: string;

	@ApiProperty({ required: false, minimum: 1 })
	@I18nIsId()
	@IsOptional()
	promotion?: number;

	@ApiProperty({ required: false })
	@I18nIsEmail()
	@IsOptional()
	secondary_email?: email;

	@ApiProperty({ required: false })
	@I18nIsPhoneNumber()
	@IsOptional()
	phone?: string;

	@ApiProperty({ required: false })
	@I18nIsPhoneNumber()
	@IsOptional()
	parents_phone?: string;
}

export class InputUpdateUserVisibilityDTO implements InputUpdateUserVisibilityDto {
	@ApiProperty()
	@I18nIsBoolean()
	email: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	birth_date: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	gender: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	pronouns: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	promotion: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	secondary_email: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	phone: boolean;

	@ApiProperty()
	@I18nIsBoolean()
	parents_phone: boolean;
}
