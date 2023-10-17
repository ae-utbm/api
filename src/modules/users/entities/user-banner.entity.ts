import type { UserBannerEntity } from '#types/api';

import { Entity, OneToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { File } from '@modules/files/entities/file.entity';

import { User } from './user.entity';

@Entity()
export class UserBanner extends File<User> implements UserBannerEntity<User> {
	@ApiProperty({ type: Number, minimum: 1 })
	@OneToOne(() => User, (user) => user.banner, { nullable: true, owner: true })
	banner_user: User;

	@Property({ persist: false })
	get owner(): User {
		return this.banner_user;
	}
}
