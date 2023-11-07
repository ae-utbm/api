import type { OutputBaseDto } from '#types/api';

import { BaseEntity as BE, Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Base entity used for all entities,
 * - Contains the primary key, the creation and update dates
 */
@Entity({ abstract: true })
export abstract class BaseEntity extends BE<OutputBaseDto, 'id'> {
	@PrimaryKey()
	id: number;

	@Property({ type: Date, onCreate: () => new Date() })
	created: Date;

	@Property({ type: Date, onCreate: () => new Date(), onUpdate: () => new Date() })
	updated: Date;
}
