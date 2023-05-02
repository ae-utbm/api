import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class BaseEntity {
	/** The primary key */
	@PrimaryKey()
	id: number;

	/** When does the row has been added/created */
	@Property({ type: 'date', onCreate: () => new Date() })
	createdAt = new Date();

	/** When does the row has been last updated */
	@Property({ type: 'date', onCreate: () => new Date(), onUpdate: () => new Date() })
	updatedAt = new Date();
}
