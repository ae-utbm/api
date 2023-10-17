import type { UserPictureEntity } from '#types/api';

import { Entity, OneToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { File } from '@modules/files/entities/file.entity';

import { User } from './user.entity';

@Entity()
export class UserPicture extends File<User> implements UserPictureEntity<User> {
	@ApiProperty({ type: Number, minimum: 1 })
	@OneToOne(() => User, (user) => user.picture, { nullable: true, owner: true })
	picture_user: User;

	@Property({ persist: false })
	get owner(): User {
		return this.picture_user;
	}
}
