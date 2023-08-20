import type { UserEntity, email } from '@types';

import {
	Cascade,
	Collection,
	Entity,
	// EntityDTO,
	ManyToMany,
	ManyToOne,
	OneToMany,
	OneToOne,
	Property,
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
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
	implements UserEntity<UserPicture, UserBanner, Promotion, Permission, Role, Subscription, Log, FileVisibilityGroup>
{
	//* INFORMATIONS
	@Property()
	@ApiProperty({ example: 'John' })
	first_name: string;

	@Property()
	@ApiProperty({ example: 'Doe' })
	last_name: string;

	@Property({ onCreate: () => false })
	@ApiProperty({ type: Boolean, default: false })
	email_verified: boolean;

	@Property({ nullable: true, hidden: true })
	email_verification?: string;

	/** Get the full name of the user */
	@Property({ persist: false })
	@ApiProperty({ example: 'John Doe' })
	get full_name(): string {
		return `${this.first_name} ${this.last_name}`;
	}

	@OneToOne(() => UserPicture, (picture) => picture.picture_user, { cascade: [Cascade.ALL], nullable: true })
	@ApiProperty({ type: Number, minimum: 1 })
	picture?: UserPicture;

	@OneToOne(() => UserBanner, (banner) => banner.banner_user, { cascade: [Cascade.ALL], nullable: true })
	@ApiProperty({ type: Number, minimum: 1 })
	banner?: UserBanner;

	@Property({ unique: true, type: String })
	@ApiProperty({ type: String, example: 'example@domain.com' })
	email: email;

	@Property({ hidden: true })
	password: string;

	@Property({ type: 'date' })
	@ApiProperty({ example: new Date('1999-12-31') })
	birth_date: Date;

	/** The age of the user */
	@Property({ persist: false })
	@ApiProperty()
	get age(): number {
		const diff = Date.now() - this.birth_date.getTime();
		const age = new Date(diff);
		return Math.abs(age.getUTCFullYear() - 1970);
	}

	@Property({ persist: false })
	@ApiProperty()
	get is_minor(): boolean {
		return this.age < 18;
	}

	@Property({ nullable: true })
	@ApiProperty()
	nickname?: string;

	@Property({ default: 'OTHER' })
	@ApiProperty({ example: 'OTHER', enum: ['MALE', 'FEMALE', 'OTHER'] })
	gender?: 'MALE' | 'FEMALE' | 'OTHER';

	@Property({ nullable: true })
	@ApiProperty({ example: null })
	pronouns?: string;

	// TODO: use an entity relation ?
	@Property({ nullable: true })
	@ApiProperty()
	cursus?: string;

	// TODO: use an entity relation ?
	@Property({ nullable: true })
	@ApiProperty()
	specialty?: string;

	@ManyToOne(() => Promotion, { nullable: true })
	@ApiProperty({ type: Number, minimum: 1 })
	promotion?: Promotion;

	@Property({ type: 'date', nullable: true })
	@ApiProperty({ example: Date.now() })
	last_seen?: Date;

	//* SUBSCRIPTIONS
	// @OneToMany(() => Subscription, (subscription) => subscription.user, {
	// 	cascade: [Cascade.REMOVE],
	// 	nullable: true,
	// 	orphanRemoval: true,
	// })
	// subscriptions?: Collection<Subscription>;

	// @Property({ nullable: true })
	// @ApiProperty()
	// subscriber_account?: string;

	/** The current subscription of the user */
	// @Property({ persist: false })
	// get current_subscription(): EntityDTO<Subscription> | undefined {
	// 	return this.subscriptions.toArray().find((subscription) => subscription.is_active);
	// }

	/** True if the user is currently subscribed */
	// @Property({ persist: false })
	// @ApiProperty()
	// get is_currently_subscribed(): boolean {
	// 	return this.current_subscription !== undefined;
	// }

	//* CONTACT
	@Property({ nullable: true })
	@ApiProperty()
	secondary_email?: string;

	@Property({ nullable: true })
	@ApiProperty()
	phone?: string;

	@Property({ nullable: true })
	@ApiProperty()
	parent_contact?: string;

	//* PERMISSIONS & TRACKING
	@OneToMany(() => Permission, (permission) => permission.user, {
		cascade: [Cascade.REMOVE],
		orphanRemoval: true,
		nullable: true,
	})
	permissions? = new Collection<Permission>(this);

	@ManyToMany(() => Role, (role) => role.users, { nullable: true })
	roles? = new Collection<Role>(this);

	@OneToMany(() => Log, (log) => log.user, { cascade: [Cascade.REMOVE], orphanRemoval: true, nullable: true })
	logs? = new Collection<Log>(this);

	//* FILES
	@ManyToMany(() => FileVisibilityGroup, (group) => group.users, { nullable: true })
	files_visibility_groups? = new Collection<FileVisibilityGroup>(this);
}
