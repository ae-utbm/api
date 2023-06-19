import type { UserPictureEntity } from '@types';

import { Entity, OneToOne } from '@mikro-orm/core';
import { FileEntity } from '@modules/_mixin/entities/file.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ tableName: 'users_pictures' })
export class UserPicture extends FileEntity implements UserPictureEntity<User> {
	@ApiProperty({ type: Number })
	@OneToOne(() => User, (user) => user.picture, { owner: true, unique: true })
	user: User;
}
