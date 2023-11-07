import type { email } from '#types';
import type {
	InputSignInDto,
	InputRegisterUserAdminDto,
	InputRegisterUserDto,
	I18nTranslations,
	InputRegisterUsersAdminDto,
} from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { I18nIsId, I18nIsEmail, I18nIsDate, I18nIsString, I18nIsStrongPassword } from '@modules/base/decorators';

export class InputRegisterUserAdminDTO implements InputRegisterUserAdminDto {
	@ApiProperty({ example: 'example@domain.com' })
	@I18nIsEmail()
	email: email;

	@ApiProperty({ example: new Date('2001-01-01').toISOString() })
	@I18nIsDate()
	birth_date: Date;

	@ApiProperty({ example: 'John' })
	@I18nIsString()
	first_name: string;

	@ApiProperty({ example: 'Doe' })
	@I18nIsString()
	last_name: string;
}

export class InputRegisterUsersAdminDTO implements InputRegisterUsersAdminDto {
	@ApiProperty({ type: InputRegisterUserAdminDTO, isArray: true })
	@ArrayNotEmpty({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.not_empty') })
	@ArrayUnique({ message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.duplicate') })
	@ValidateNested({
		each: true,
		message: i18nValidationMessage<I18nTranslations>('validations.array.invalid.format', {
			type: InputRegisterUserAdminDTO.name,
		}),
	})
	@Type(() => InputRegisterUserAdminDTO)
	users: InputRegisterUserAdminDTO[];
}

export class InputRegisterUserDTO extends InputRegisterUserAdminDTO implements InputRegisterUserDto {
	@ApiProperty({ example: 'password' })
	@I18nIsStrongPassword()
	password: string;
}

export class InputSignInDTO implements InputSignInDto {
	@ApiProperty({ type: String })
	@I18nIsEmail()
	email: email;

	@ApiProperty({ example: 'password' })
	@I18nIsStrongPassword()
	password: string;
}

export class InputEmailParamsDTO {
	@ApiProperty()
	@I18nIsString() // Because it's a 12 chars password not a JWT token
	token: string;

	@ApiProperty()
	@I18nIsId()
	user_id: number;
}
