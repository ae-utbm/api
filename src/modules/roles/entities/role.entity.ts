import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { PermissionName } from '@/modules/auth/decorators/perms.decorator';
import { User } from '@/modules/users/entities/user.entity';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
	/** Name of the role, in caps */
	@Property()
	name: Uppercase<string>;

	/** Determine wether the role is still active */
	@Property({ name: 'is_revoked', onCreate: () => false })
	revoked = false;

	/** Specify when the role should expires */
	@Property({ name: 'expires_at' })
	expires: Date;

	/** Specify what permissions the role has */
	@Property({ name: 'permissions' })
	permissions: PermissionName[];

	/** Specify to which user the role is attached */
	@ManyToMany({ entity: () => User, inversedBy: 'roles' })
	users = new Collection<User>(this);
}
