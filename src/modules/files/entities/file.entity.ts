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
export abstract class File<T> extends BaseEntity implements FE<FileVisibilityGroup, T> {
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

	@ManyToOne(() => FileVisibilityGroup, { nullable: true, default: null })
	@ApiProperty({ type: Number, minimum: 1 })
	visibility?: FileVisibilityGroup;

	@Property({ nullable: true, default: null })
	@ApiProperty({ type: String, nullable: true })
	description?: string;

	abstract get owner(): T;
}
