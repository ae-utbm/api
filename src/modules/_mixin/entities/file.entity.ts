import type { FileEntity as FE, VISIBILITY } from '@types';

import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ abstract: true })
export abstract class FileEntity extends BaseEntity implements FE {
	@Property()
	@ApiProperty()
	filename: string;

	@Property()
	@ApiProperty()
	mimetype: string;

	@Property()
	@ApiProperty()
	path: string;

	@Property()
	@ApiProperty()
	size: number;

	@Property()
	@ApiProperty({ enum: ['public', 'private', 'hidden'] })
	visibility: VISIBILITY;

	@Property({ nullable: true })
	@ApiProperty({ required: false })
	description?: string;
}
