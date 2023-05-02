import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from '@/database/entities/base.entity';
import { User } from '@/modules/users/entities/user.entity';
import { PermissionName } from '@/modules/auth/decorators/perms.decorator';

@Entity({ tableName: 'permissions' })
export class Permission extends BaseEntity {
	/** Name of the permission, in caps */
	@Property()
	name: PermissionName;

	/** Determine wether the permission is still active */
	@Property({ name: 'is_revoked', onCreate: () => false })
	revoked = false;

	/** Specify when the permission should expires */
	@Property({ name: 'expires_at' })
	expires: Date;

	/** Specify to which user the permission is attached */
	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	user: User;
}
