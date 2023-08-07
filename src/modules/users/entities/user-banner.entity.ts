import type { UserBannerEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { File } from '@modules/files/entities/file.entity';

import { User } from './user.entity';

@Entity({ tableName: 'users_banners' })
export class UserBanner extends File implements UserBannerEntity<User> {
	@ApiProperty({ type: Number, minimum: 1 })
	@OneToOne(() => User, (user) => user.banner, { owner: true, unique: true })
	user: User;
}
