import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Min } from 'class-validator';

/**
 * Base arguments to be used as arguments for all GraphQL mutations/queries
 */
@ArgsType()
export abstract class BaseArgs {
	/** The primary key */
	@Field(() => Int)
	@Min(1)
	id: number;
}
