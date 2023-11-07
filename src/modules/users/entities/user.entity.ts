import type { email } from '#types';

import { Cascade, Collection, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, Property } from '@mikro-orm/core';

import { USER_GENDER } from '@exported/api/constants/genders';
import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { Log } from '@modules/logs/entities/log.entity';
import { Permission } from '@modules/permissions/entities/permission.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';
import { Role } from '@modules/roles/entities/role.entity';

import { UserBanner } from './user-banner.entity';
import { UserPicture } from './user-picture.entity';

export type Request = Express.Request & {
	user: User;
};

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
	//* INFORMATIONS
	@Property()
	first_name: string;

	@Property()
	last_name: string;

	/** Get the full name of the user */
	@Property({ persist: false })
	get full_name(): string {
		return `${this.first_name} ${this.last_name}`;
	}

	@OneToOne(() => UserPicture, (picture) => picture.picture_user, {
		cascade: [Cascade.ALL],
		nullable: true,
		serializedName: 'picture_id',
		serializer: (p: UserPicture) => p?.id,
	})
	picture?: UserPicture;

	@OneToOne(() => UserBanner, (banner) => banner.banner_user, {
		cascade: [Cascade.ALL],
		nullable: true,
		serializedName: 'banner_id',
		serializer: (b: UserBanner) => b?.id,
	})
	banner?: UserBanner;

	@Property({ unique: true, type: String })
	email: email;

	@Property({ onCreate: () => false, hidden: true })
	email_verified: boolean;

	@Property({ nullable: true, hidden: true })
	email_verification?: string;

	@Property({ hidden: true })
	password: string;

	@Property({ type: 'date' })
	birth_date: Date;

	/** The age of the user */
	@Property({ persist: false })
	get age(): number {
		const diff = Date.now() - (this.birth_date instanceof Date ? this.birth_date : new Date(this.birth_date)).getTime();
		const age = new Date(diff);
		return Math.abs(age.getUTCFullYear() - 1970);
	}

	@Property({ persist: false })
	get is_minor(): boolean {
		return this.age < 18;
	}

	@Property({ nullable: true })
	nickname?: string;

	@Property({ default: USER_GENDER[0] })
	gender?: (typeof USER_GENDER)[number];

	@Property({ nullable: true })
	pronouns?: string;

	// TODO: (KEY: 1) Make a PR to implement cursus & specialty in the API
	//* Should be a One to Many relation (one user can have multiple semester)
	// @Property({ nullable: true })
	// cursus?: string;

	// @Property({ nullable: true })
	// specialty?: string;

	@ManyToOne(() => Promotion, { nullable: true })
	promotion?: Promotion;

	@Property({ type: 'date', nullable: true, onCreate: () => new Date() })
	last_seen?: Date;

	//* SUBSCRIPTIONS
	// TODO: (KEY: 2) Make a PR to implement subscriptions in the API
	@Property({ onCreate: () => false, hidden: true })
	subscribed: boolean;

	//* CONTACT
	@Property({ nullable: true })
	secondary_email?: email;

	@Property({ nullable: true })
	phone?: string;

	@Property({ nullable: true })
	parents_phone?: string;

	//* PERMISSIONS & TRACKING
	@OneToMany(() => Permission, (permission) => permission.user, {
		cascade: [Cascade.REMOVE],
		orphanRemoval: true,
		nullable: true,
		hidden: true,
	})
	permissions? = new Collection<Permission>(this);

	@ManyToMany(() => Role, (role) => role.users, { nullable: true, hidden: true })
	roles? = new Collection<Role>(this);

	@OneToMany(() => Log, (log) => log.user, {
		cascade: [Cascade.REMOVE],
		orphanRemoval: true,
		nullable: true,
		hidden: true,
	})
	logs? = new Collection<Log>(this);

	@Property({ type: Date, nullable: true, onCreate: () => null, hidden: true })
	verified?: Date;

	//* FILES
	@ManyToMany(() => FileVisibilityGroup, (group) => group.users, { nullable: true, hidden: true })
	files_visibility_groups? = new Collection<FileVisibilityGroup>(this);
}
