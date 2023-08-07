import type { FileVisibilityGroupEntity } from '@types';

import { Collection, Entity, ManyToMany, OneToMany, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@modules/_mixin/entities/base.entity';
import { File } from '@modules/files/entities/file.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity({ tableName: 'files_visibility_groups' })
export class FileVisibilityGroup extends BaseEntity implements FileVisibilityGroupEntity<User> {
	@Property()
	@ApiProperty()
	name: Uppercase<string>;

	@Property({ nullable: true })
	@ApiProperty({ required: false })
	description?: string;

	/**
	 * Note: Used the 'string' version of the entity name to avoid circular dependency issues.
	 */
	@ManyToMany(() => 'User', (user: User) => user.files_visibility_groups, { owner: true })
	users = new Collection<User>(this);

	@OneToMany(() => File, (file) => file.visibility)
	files = new Collection<File>(this);
}
