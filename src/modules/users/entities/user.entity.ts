import { Role } from '@modules/roles/entities/role.entity';
import { Cascade, Collection, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from 'src/database/entities/base.entity';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';
import { Permission } from 'src/modules/perms/entities/permission.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
	/** The first name of the user, @example 'John' */
	@Property()
	first_name: string;

	/** The last name of the user, @example 'Doe' */
	@Property()
	last_name: string;

	/** Get the full name of the user */
	@Property({ persist: false })
	get full_name(): string {
		return `${this.first_name} ${this.last_name}`;
	}

	/** The email of the user, @example 'example@domain.net' */
	@Property({ unique: true })
	email: string;

	/** The encrypted user password */
	@Property()
	password: string;

	/** The birthday of the user */
	@Property()
	birthday: Date;

	/** The age of the user */
	@Property({ persist: false })
	get age(): number {
		const diff = Date.now() - this.birthday.getTime();
		const age = new Date(diff);
		return Math.abs(age.getUTCFullYear() - 1970);
	}

	/** True if the user is minor */
	@Property({ persist: false })
	get is_minor(): boolean {
		return this.age < 18;
	}

	/** The nickname of the user, @example 'fenshmirtz' // + Doe => Doofenshmirtz */
	@Property({ nullable: true })
	nickname?: string;

	/** Gender of the user */
	// TODO: use an enum ? or an entity relation (dynamic) ?
	@Property({ nullable: true })
	gender?: string;

	/** Cursus of the user within the school */
	// TODO: use an entity relation ?
	@Property({ nullable: true })
	cursus?: string;

	/** Promotion of the user */
	@ManyToOne(() => Promotion, { nullable: true })
	promotion?: number;

	/** Linked refresh tokens to the user */
	@OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, { cascade: [Cascade.REMOVE] })
	refresh_tokens = new Collection<RefreshToken>(this);

	/** Linked permissions to the user */
	@OneToMany(() => Permission, (permission) => permission.user, { cascade: [Cascade.REMOVE] })
	permissions = new Collection<Permission>(this);

	/** Linked roles to the user */
	@ManyToMany({ entity: () => Role, mappedBy: 'users' })
	roles = new Collection<Role>(this);
}
