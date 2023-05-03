import { BaseEntity as BE, Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Base entity used for all entities,
 * containing the primary key and the creation and update dates
 */
@Entity({ abstract: true })
export abstract class BaseEntity extends BE<BaseEntity, 'id'> {
	/** The primary key */
	@PrimaryKey()
	id: number;

	/** When does the row has been added/created */
	@Property({ name: 'created_at', type: 'date', onCreate: () => new Date() })
	created = new Date();

	/** When does the row has been last updated */
	@Property({ name: 'updated_at', type: 'date', onCreate: () => new Date(), onUpdate: () => new Date() })
	updated = new Date();
}
