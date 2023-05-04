import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ abstract: true })
export abstract class FileEntity extends BaseEntity {
	@Property()
	filename: string;

	@Property()
	mimetype: string;

	@Property()
	path: string;
}
