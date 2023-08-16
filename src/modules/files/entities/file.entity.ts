import type { FileEntity as FE } from '@types';

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

	@Property({ persist: false })
	@ApiProperty()
	get is_public(): boolean {
		return this.visibility === null;
	}

	@Property({ persist: false })
	@ApiProperty()
	get is_hidden(): boolean {
		if (this.is_public) return false;
		return this.visibility.users && this.visibility.users.length === 0 ? true : false;
	}

	@Property()
	@ApiProperty()
	description: string;
}
