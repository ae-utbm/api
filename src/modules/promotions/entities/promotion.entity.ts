import { BaseEntity } from '@database/entities/base.entity';
import { Cascade, Collection, Entity, OneToMany, Property } from '@mikro-orm/core';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'promotions' })
export class Promotion extends BaseEntity {
	@Property()
	number: number;

	@OneToMany(() => User, (user) => user.promotion, { cascade: [Cascade.REMOVE] })
	users = new Collection<User>(this);
}
