import type { email } from '#types';
import type {
	IUserBannerResponseDTO,
	IUserPictureResponseDTO,
	IUserRoleGetDTO,
	IUserVisibilityGetDTO,
} from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEmail, IsIn, IsInt, IsNumber, IsString } from 'class-validator';

import { IUserGetDTO, PERMISSION_NAMES } from '#types/api';
import { USER_GENDER } from '@exported/api/constants/genders';
import { PERMISSIONS_NAMES } from '@exported/api/constants/perms';
import { BaseResponseDTO } from '@modules/_mixin/dto/base.dto';
import { FileGetDTO } from '@modules/files/dto/get.dto';

export class UserRoleGetDTO implements IUserRoleGetDTO {
	@ApiProperty({ required: true, minimum: 1 })
	@IsInt()
	id: number;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	created: Date;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	updated: Date;

	@ApiProperty({ required: true, type: Date })
	@IsDate()
	expires: Date;

	@ApiProperty({ required: true, example: 'AE_ADMINS' })
	@IsString()
	name: Uppercase<string>;

	@ApiProperty({ required: true, type: Boolean, default: false })
	@IsBoolean()
	revoked: boolean;

	@ApiProperty({ enum: PERMISSIONS_NAMES, isArray: true })
	@IsString()
	permissions: Array<PERMISSION_NAMES>;
}

export class UserGetDTO extends BaseResponseDTO implements IUserGetDTO {
	@ApiProperty({ example: 'John' })
	@IsString()
	first_name: string;

	@ApiProperty({ example: 'Doe' })
	@IsString()
	last_name: string;

	@ApiProperty({ minimum: 1 })
	@IsNumber()
	picture?: number;

	@ApiProperty({ minimum: 1 })
	@IsNumber()
	banner?: number;

	@ApiProperty({ type: String, example: 'example@domain.com' })
	@IsEmail()
	email: email;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	email_verified: boolean;

	@ApiProperty({ example: new Date('1999-12-31').toISOString() })
	@IsDate()
	birth_date: Date;

	@ApiProperty()
	@IsString()
	nickname?: string;

	@ApiProperty({ example: USER_GENDER[0], enum: USER_GENDER })
	@IsString()
	@IsIn(USER_GENDER)
	gender?: (typeof USER_GENDER)[number];

	@ApiProperty({ example: null })
	@IsString()
	pronouns?: string;

	@ApiProperty({ type: Number, minimum: 1 })
	@IsNumber()
	promotion?: number;

	@ApiProperty({ example: new Date().toISOString() })
	@IsDate()
	last_seen?: Date;

	@ApiProperty({ example: false })
	@IsBoolean()
	subscribed: boolean; // TODO: (KEY: 2) Make a PR to implement subscriptions in the API

	@ApiProperty()
	@IsEmail()
	secondary_email?: string;

	@ApiProperty()
	@IsString()
	phone?: string;

	@ApiProperty()
	@IsString()
	parent_contact?: string;

	@ApiProperty({ type: Date })
	@IsDate()
	verified?: Date;
}

export class UserVisibilityGetDTO implements IUserVisibilityGetDTO {
	@ApiProperty({ minimum: 1 })
	@IsInt()
	user: number;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	email: boolean;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	secondary_email: boolean;

	@ApiProperty({ type: Boolean, default: true })
	@IsBoolean()
	birth_date: boolean;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	gender: boolean;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	pronouns: boolean;

	@ApiProperty({ type: Boolean, default: true })
	@IsBoolean()
	promotion: boolean;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	phone: boolean;

	@ApiProperty({ type: Boolean, default: false })
	@IsBoolean()
	parent_contact: boolean;
}

export class UserGetPictureDTO extends FileGetDTO implements IUserPictureResponseDTO {
	@ApiProperty({ minimum: 1 })
	@IsInt()
	picture_user: number;
}

export class UserGetBannerDTO extends FileGetDTO implements IUserBannerResponseDTO {
	@ApiProperty({ minimum: 1 })
	@IsInt()
	banner_user: number;
}
