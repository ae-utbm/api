import type { BaseEntity as BEI } from '#types/api';

import { BaseEntity as BE, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base entity used for all entities,
 * containing the primary key and the creation and update dates
 */
@Entity({ abstract: true })
export abstract class BaseEntity extends BE<BaseEntity, 'id'> implements BEI {
	@PrimaryKey()
	@ApiProperty({ minimum: 1 })
	id: number;

	@Property({ type: Date, onCreate: () => new Date() })
	@ApiProperty({ type: Date })
	created_at: Date;

	@Property({ type: Date, onCreate: () => new Date(), onUpdate: () => new Date() })
	@ApiProperty({ type: Date })
	updated_at: Date;
}
