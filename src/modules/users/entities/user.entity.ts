import { Cascade, Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';
import { Permission } from 'src/modules/perms/entities/permission.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
	/** The first name of the user, @example 'John' */
	@Property()
	firstName: string;

	/** The last name of the user, @example 'Doe' */
	@Property()
	lastName: string;

	/** The email of the user, @example 'example@domain.net' */
	@Property()
	email: string;

	/** The encrypted user password */
	@Property()
	password: string;

	/** The birthday of the user */
	@Property()
	birthday: Date;

	/** Linked refresh tokens to the user */
	@OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, { cascade: [Cascade.REMOVE] })
	refreshTokens = new Collection<RefreshToken>(this);

	/** Linked permissions to the user */
	@OneToMany(() => Permission, (permission) => permission.user, { cascade: [Cascade.REMOVE] })
	permissions = new Collection<Permission>(this);
}
