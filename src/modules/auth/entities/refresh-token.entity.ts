import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken extends BaseEntity {
	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	user: User;

	@Property({ name: 'is_revoked', onCreate: () => false })
	revoked = false;

	@Property({ name: 'expires_at' })
	expires: Date;
}
