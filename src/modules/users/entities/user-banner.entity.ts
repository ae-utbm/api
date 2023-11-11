import { Entity, OneToOne, Property } from '@mikro-orm/core';

import { File } from '@modules/files/entities/file.entity';

import { User } from './user.entity';

@Entity()
export class UserBanner extends File<User> {
	@OneToOne(() => User, (user) => user.banner, {
		nullable: true,
		owner: true,
		serializedName: 'owner',
		serializer: (u: User) => ({ kind: 'user', id: u?.id }),
	})
	banner_user: User;

	@Property({ persist: false, hidden: true })
	get owner(): User {
		return this.banner_user;
	}
}
