import type { UserBannerEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { FileEntity } from '@modules/_mixin/entities/file.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ tableName: 'users_banners' })
export class UserBanner extends FileEntity implements UserBannerEntity<User> {
	@ApiProperty({ type: Number, minimum: 1 })
	@OneToOne(() => User, (user) => user.banner, { owner: true, unique: true })
	user: User;
}
