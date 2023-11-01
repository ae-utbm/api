import type { IFileGetDTO, IFileVisibilityGroupGetDTO } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsString } from 'class-validator';

export class FileGetDTO implements IFileGetDTO {
	@ApiProperty()
	@IsInt()
	id: number;

	@ApiProperty()
	@IsDate()
	updated: Date;

	@ApiProperty()
	@IsDate()
	created: Date;

	@ApiProperty()
	@IsString()
	filename: string;

	@ApiProperty()
	@IsString()
	mimetype: string;

	@ApiProperty()
	@IsString()
	path: string;

	@ApiProperty()
	@IsInt()
	size: number;

	@ApiProperty({ required: false })
	@IsInt()
	visibility?: number;

	@ApiProperty()
	@IsString()
	description?: string;
}

export class FileVisibilityGroupGetDTO implements IFileVisibilityGroupGetDTO {
	@ApiProperty()
	@IsString() // TODO : verify uppercase
	name: Uppercase<string>;

	@ApiProperty()
	@IsString()
	description: string;

	@ApiProperty()
	@IsInt()
	users: number;

	@ApiProperty()
	@IsInt()
	files: number;
}
