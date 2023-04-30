import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class BaseEntity {
	@PrimaryKey()
	id: number;

	@Property({ type: 'date', onCreate: () => new Date() })
	createdAt = new Date();

	@Property({ type: 'date', onCreate: () => new Date(), onUpdate: () => new Date() })
	updatedAt = new Date();
}
