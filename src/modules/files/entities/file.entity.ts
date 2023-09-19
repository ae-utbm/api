import type { FileEntity as FE } from '#types/api';

import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';

@Entity({
	tableName: 'files',
	discriminatorColumn: 'type',
	discriminatorMap: {
		promotion_picture: 'PromotionPicture',
		user_picture: 'UserPicture',
		user_banner: 'UserBanner',
	},
	abstract: true,
})
export class File extends BaseEntity implements FE<FileVisibilityGroup> {
	@Property()
	@ApiProperty()
	filename: string;

	@Property()
	@ApiProperty()
	mimetype: string;

	@Property({ hidden: true })
	path: string;

	@Property()
	@ApiProperty()
	size: number;

	@ManyToOne(() => FileVisibilityGroup, { nullable: true })
	@ApiProperty({ type: Number, minimum: 1 })
	visibility?: FileVisibilityGroup;

	@Property()
	@ApiProperty()
	description: string;
}
