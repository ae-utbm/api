import type { OutputFileDto, OutputFileVisibilityGroupDto } from '#types/api';

import { ApiProperty } from '@nestjs/swagger';

import { OutputBaseDTO } from '@modules/base/dto/output.dto';

export class OutputFileDTO implements OutputFileDto {
	@ApiProperty()
	id: number;

	@ApiProperty()
	updated: Date;

	@ApiProperty()
	created: Date;

	@ApiProperty()
	filename: string;

	@ApiProperty()
	mimetype: string;

	@ApiProperty()
	path: string;

	@ApiProperty()
	size: number;

	@ApiProperty({ required: false })
	visibility?: number;

	@ApiProperty()
	description?: string;
}

export class OutputFileVisibilityGroupDTO extends OutputBaseDTO implements OutputFileVisibilityGroupDto {
	@ApiProperty()
	name: Uppercase<string>;

	@ApiProperty()
	description: string;

	@ApiProperty()
	users_count: number;

	@ApiProperty()
	files_count: number;
}
