import { Entity, OneToOne, Property } from '@mikro-orm/core';

import { File } from '@modules/files/entities/file.entity';

import { User } from './user.entity';

@Entity()
export class UserPicture extends File<User> {
	@OneToOne(() => User, (user) => user.picture, {
		nullable: true,
		owner: true,
		serializedName: 'picture_user_id',
		serializer: (u: User) => u.id,
	})
	picture_user: User;

	@Property({ persist: false, hidden: true })
	get owner(): User {
		return this.picture_user;
	}
}
