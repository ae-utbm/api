import { Entity, OneToOne } from '@mikro-orm/core';
import { FileEntity } from '@database/entities/file.entity';
import { User } from './user.entity';

@Entity({ tableName: 'users_banners' })
export class UserBanner extends FileEntity {
	@OneToOne(() => User, (user) => user.banner, { owner: true, unique: true })
	user: User;
}
