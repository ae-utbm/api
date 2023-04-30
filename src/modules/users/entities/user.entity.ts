import { Cascade, Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';
import { Permission } from 'src/modules/perms/entities/permission.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
	@Property()
	firstName: string;

	@Property()
	lastName: string;

	@Property()
	email: string;

	@Property()
	password: string;

	@Property()
	birthday: Date;

	@OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, { cascade: [Cascade.REMOVE] })
	refreshTokens = new Collection<RefreshToken>(this);

	@OneToMany(() => Permission, (permission) => permission.user, { cascade: [Cascade.REMOVE] })
	permissions = new Collection<Permission>(this);
}
