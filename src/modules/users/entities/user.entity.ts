import type { UserEntity, Email } from '@types';

import {
	Cascade,
	Collection,
	Entity,
	EntityDTO,
	ManyToMany,
	ManyToOne,
	OneToMany,
	OneToOne,
	Property,
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { Log } from '@modules/logs/entities/log.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { Role } from '@modules/roles/entities/role.entity';
import { Subscription } from '@modules/subscription/entities/subscription.entity';

import { UserBanner } from './user-banner.entity';
import { UserPicture } from './user-picture.entity';

@Entity({ tableName: 'users' })
export class User
	extends BaseEntity
	implements UserEntity<UserPicture, UserBanner, Promotion, Permission, Role, Subscription, Log>
{
	//* INFORMATIONS
	/** The first name of the user, @example 'John' */
	@Property()
	@ApiProperty()
	first_name: string;

	/** The last name of the user, @example 'Doe' */
	@Property()
	@ApiProperty()
	last_name: string;

	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean })
	email_verified = false;

	@Property({ nullable: true, hidden: true })
	email_verification?: string;

	/** Get the full name of the user */
	@Property({ persist: false })
	@ApiProperty()
	get full_name(): string {
		return `${this.first_name} ${this.last_name}`;
	}

	/** The user profile picture */
	@OneToOne(() => UserPicture, (picture) => picture.user, { cascade: [Cascade.ALL], nullable: true })
	@ApiProperty()
	picture?: UserPicture;

	/** The user profile banner */
	@OneToOne(() => UserBanner, (banner) => banner.user, { cascade: [Cascade.ALL], nullable: true })
	@ApiProperty()
	banner?: UserBanner;

	/** The main email of the user, used to login, @example 'example@domain.net' */
	@Property({ unique: true, type: String })
	@ApiProperty({ type: String })
	email: Email;

	/** The encrypted user password */
	@Property({ hidden: true })
	password: string;

	/** The birthday of the user */
	@Property({ type: 'date' })
	@ApiProperty()
	birthday: Date;

	/** The age of the user */
	@Property({ persist: false })
	@ApiProperty()
	get age(): number {
		const diff = Date.now() - this.birthday.getTime();
		const age = new Date(diff);
		return Math.abs(age.getUTCFullYear() - 1970);
	}

	/** True if the user is minor */
	@Property({ persist: false })
	@ApiProperty()
	get is_minor(): boolean {
		return this.age < 18;
	}

	/** The nickname of the user, @example 'fenshmirtz' // + Doe => Doofenshmirtz */
	@Property({ nullable: true })
	@ApiProperty()
	nickname?: string;

	/** Gender of the user */
	@Property({ nullable: true })
	@ApiProperty()
	gender?: string;

	/** The pronouns of the user */
	@Property({ nullable: true })
	@ApiProperty()
	pronouns?: string;

	/** Cursus of the user within the school */
	// TODO: use an entity relation ?
	@Property({ nullable: true })
	@ApiProperty()
	cursus?: string;

	/** Specialty of the user */
	// TODO: use an entity relation ?
	@Property({ nullable: true })
	@ApiProperty()
	specialty?: string;

	/** Promotion of the user */
	@ManyToOne(() => Promotion, { nullable: true })
	@ApiProperty({ type: Number })
	promotion?: Promotion;

	/** The last time the user was seen online (JWT Token generated) */
	@Property({ type: 'date', nullable: true })
	@ApiProperty()
	last_seen?: Date;

	//* SUBSCRIPTIONS
	/** The subscription of the user */
	@OneToMany(() => Subscription, (subscription) => subscription.user, {
		cascade: [Cascade.REMOVE],
		nullable: true,
		orphanRemoval: true,
	})
	subscriptions?: Collection<Subscription>;

	/** Subscriber account number, undefined if he never subscribed */
	@Property({ nullable: true })
	@ApiProperty()
	subscriber_account?: string;

	/** The current subscription of the user */
	@Property({ persist: false })
	get current_subscription(): EntityDTO<Subscription> | undefined {
		return this.subscriptions.toArray().find((subscription) => subscription.is_active);
	}

	/** True if the user is currently subscribed */
	@Property({ persist: false })
	@ApiProperty()
	get is_currently_subscribed(): boolean {
		return this.current_subscription !== undefined;
	}

	//* CONTACT
	/** The secondary email of the user, used for communications emails */
	@Property({ nullable: true })
	@ApiProperty()
	secondary_email?: string;

	/** The phone number of the user */
	@Property({ nullable: true })
	@ApiProperty()
	phone?: string;

	/** Parent contact (for minors only) */
	@Property({ nullable: true })
	@ApiProperty()
	parent_contact?: string;

	//* PERMISSIONS & AUTHENTIFICATION
	/** Linked permissions to the user */
	@OneToMany(() => Permission, (permission) => permission.user, { cascade: [Cascade.REMOVE], orphanRemoval: true })
	permissions = new Collection<Permission>(this);

	/** Linked roles to the user */
	@ManyToMany(() => Role, (role) => role.users)
	roles = new Collection<Role>(this);

	@OneToMany(() => Log, (log) => log.user, { cascade: [Cascade.REMOVE], orphanRemoval: true })
	logs = new Collection<Log>(this);
}
