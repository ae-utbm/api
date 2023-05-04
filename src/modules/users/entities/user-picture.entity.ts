import { Entity, OneToOne } from '@mikro-orm/core';
import { User } from './user.entity';
import { FileEntity } from '@database/entities/file.entity';

@Entity({ tableName: 'users_pictures' })
export class UserPicture extends FileEntity {
	@OneToOne(() => User, (user) => user.picture, { owner: true, unique: true })
	user: User;
}
