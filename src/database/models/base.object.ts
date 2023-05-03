import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Base object to be used as return object for all GraphQL mutations/queries
 */
@ObjectType()
export abstract class BaseObject {
	/** The primary key */
	@Field(() => Int)
	id: number;

	/** When does the object has been created (added to the database) */
	@Field()
	created: Date;

	/** When does the object has been last updated (modified in the database) */
	@Field()
	updated: Date;
}
