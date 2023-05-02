import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken extends BaseEntity {
	/** Determine wether or not the refresh token has been revoked (used or expired) */
	@Property({ name: 'is_revoked', onCreate: () => false })
	revoked = false;

	/** Tell when the token is expected to expire */
	@Property({ name: 'expires_at' })
	expires: Date;

	/** To which user the token is attached */
	@ManyToOne(() => User, { onDelete: 'cascade', joinColumn: 'user_id' })
	user: User;
}
