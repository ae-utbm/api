import type { email } from '#types';
import type {
	OutputUserBannerDto,
	OutputUserPictureDto,
	OutputUserRoleDto,
	OutputUserVisibilityDto,
	OutputBaseUserDto,
} from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { OutputUserDto, PERMISSION_NAMES, GENDERS } from '#types/api';
import { USER_GENDER } from '@exported/api/constants/genders';
import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { OutputBaseDTO } from '@modules/base/dto/output.dto';
import { OutputFileDTO } from '@modules/files/dto/output.dto';

export class OutputBaseUserDTO extends OutputBaseDTO implements OutputBaseUserDto {
	@ApiProperty()
	first_name: string;

	@ApiProperty()
	last_name: string;

	@ApiProperty({ required: false })
	nickname?: string;
}

export class OutputUserRoleDTO extends OutputBaseDTO implements OutputUserRoleDto {
	@ApiProperty({ required: true, type: Date, example: new Date().toISOString() })
	expires: Date;

	@ApiProperty({ required: true, example: 'AE_ADMINS' })
	name: Uppercase<string>;

	@ApiProperty({ required: true, type: Boolean, default: false })
	revoked: boolean;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	permissions: Array<PERMISSION_NAMES>;
}

export class OutputUserDTO extends OutputBaseDTO implements OutputUserDto {
	@ApiProperty({ example: 'John' })
	first_name: string;

	@ApiProperty({ example: 'Doe' })
	last_name: string;

	@ApiProperty({ example: 'John Doe' })
	full_name: string;

	@ApiProperty({ minimum: 1, required: false })
	picture?: number;

	@ApiProperty({ minimum: 1, required: false })
	banner?: number;

	@ApiProperty({ type: String, example: 'example@domain.com', required: false })
	email?: email;

	@ApiProperty({ type: Boolean, default: false })
	email_verified?: boolean;

	@ApiProperty({ example: new Date('1999-12-31').toISOString() })
	birth_date?: Date;

	@ApiProperty({ example: 21 })
	age: number;

	@ApiProperty()
	is_minor: boolean;

	@ApiProperty({ required: false })
	nickname?: string;

	@ApiProperty({ example: USER_GENDER[0], enum: USER_GENDER })
	gender?: GENDERS;

	@ApiProperty({ example: null })
	pronouns?: string;

	@ApiProperty({ minimum: 1 })
	promotion?: number;

	@ApiProperty({ example: new Date().toISOString() })
	last_seen?: Date;

	@ApiProperty({ example: false })
	subscribed: boolean; // TODO: (KEY: 2) Make a PR to implement subscriptions in the API

	@ApiProperty({ required: false })
	secondary_email?: email;

	@ApiProperty({ required: false })
	phone?: string;

	@ApiProperty({ required: false })
	parents_phone?: string;

	@ApiProperty({ type: Date, example: new Date().toISOString(), required: false })
	verified?: Date;
}

export class OutputUserVisibilityDTO implements OutputUserVisibilityDto {
	@ApiProperty({ minimum: 1 })
	user_id: number;

	@ApiProperty({ type: Boolean, default: false })
	email: boolean;

	@ApiProperty({ type: Boolean, default: false })
	secondary_email: boolean;

	@ApiProperty({ type: Boolean, default: true })
	birth_date: boolean;

	@ApiProperty({ type: Boolean, default: false })
	gender: boolean;

	@ApiProperty({ type: Boolean, default: false })
	pronouns: boolean;

	@ApiProperty({ type: Boolean, default: true })
	promotion: boolean;

	@ApiProperty({ type: Boolean, default: false })
	phone: boolean;

	@ApiProperty({ type: Boolean, default: false })
	parents_phone: boolean;
}

export class OutputUserPictureDTO extends OutputFileDTO implements OutputUserPictureDto {
	@ApiProperty({ minimum: 1 })
	picture_user_id: number;
}

export class OutputUserBannerDTO extends OutputFileDTO implements OutputUserBannerDto {
	@ApiProperty({ minimum: 1 })
	banner_user_id: number;
}
