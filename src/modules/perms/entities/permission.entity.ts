import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { TPermission } from '../decorators/perms.decorator';

@Entity({ tableName: 'permissions' })
export class Permission extends BaseEntity {
	@Property()
	name: TPermission;

	@Property()
	value: number;

	@Property({ name: 'is_revoked', onCreate: () => false })
	revoked = false;

	@Property({ name: 'expires_at' })
	expires: Date;

	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	user: User;
}
