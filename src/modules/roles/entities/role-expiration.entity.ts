import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';

import { Role } from './role.entity';

@Entity({ tableName: 'roles_expirations' })
export class RoleExpiration extends BaseEntity {
	@ManyToOne(() => User, { serializedName: 'user_id', serializer: (u: User) => u.id })
	user: User;

	@ManyToOne(() => Role, { serializedName: 'role_id', serializer: (r: Role) => r.id })
	role: Role;

	@Property({ name: 'expires_at' })
	@ApiProperty()
	expires: Date;

	@Property({ default: false })
	@ApiProperty()
	revoked: boolean;
}
