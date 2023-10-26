import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

import { Role } from './role.entity';

@Entity({ tableName: 'roles_expirations' })
export class RoleExpiration extends BaseEntity {
	/** Specify which user is attached to that role */
	@ManyToOne(() => User)
	user: User;

	/** Specify which role is attached to that user */
	@ManyToOne(() => Role)
	role: Role;

	/** Specify when the role should expires */
	@Property({ name: 'expires_at' })
	@ApiProperty()
	expires: Date;

	@Property({ default: false })
	@ApiProperty()
	revoked: boolean;
}
