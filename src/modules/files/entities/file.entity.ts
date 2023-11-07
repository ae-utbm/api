import { Entity, ManyToOne, Property } from '@mikro-orm/core';

import { BaseEntity } from '@modules/base/entities/base.entity';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { PromotionPicture } from '@modules/promotions/entities/promotion-picture.entity';
import { UserBanner } from '@modules/users/entities/user-banner.entity';
import { UserPicture } from '@modules/users/entities/user-picture.entity';

export type FileKind = UserPicture | UserBanner | PromotionPicture;

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
export abstract class File<T> extends BaseEntity {
	@Property()
	filename: string;

	@Property()
	mimetype: string;

	@Property({ hidden: true })
	path: string;

	@Property()
	size: number;

	@ManyToOne(() => FileVisibilityGroup, {
		nullable: true,
		default: null,
		serializedName: 'visibility_id',
		serializer: (v: FileVisibilityGroup) => v?.id,
	})
	visibility?: FileVisibilityGroup;

	@Property({ nullable: true, default: null })
	description?: string;

	abstract get owner(): T;
}
