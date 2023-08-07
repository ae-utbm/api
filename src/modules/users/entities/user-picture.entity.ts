import type { UserPictureEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { File } from '@modules/files/entities/file.entity';

import { User } from './user.entity';

@Entity({ tableName: 'users_pictures' })
export class UserPicture extends File implements UserPictureEntity<User> {
	@ApiProperty({ type: Number, minimum: 1 })
	@OneToOne(() => User, (user) => user.picture, { owner: true, unique: true })
	user: User;
}
