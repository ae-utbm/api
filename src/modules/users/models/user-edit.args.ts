import { BaseArgs } from '@database/models/base.args';
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsEmail, IsStrongPassword } from 'class-validator';

@ArgsType()
export class UserEditArgs extends BaseArgs {
	@Field(() => String, { nullable: true })
	@IsEmail({ host_blacklist: ['utbm.fr'] })
	email?: string;

	@Field(() => String, { nullable: true })
	@IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
	password?: string;

	@Field(() => String, { nullable: true })
	first_name?: string;

	@Field(() => String, { nullable: true })
	last_name?: string;

	@Field(() => String, { nullable: true })
	nickname?: string;

	// TODO: use an enum ?
	@Field(() => String, { nullable: true })
	gender?: string;

	// TODO: might be replaced by an entity relation ?
	@Field(() => String, { nullable: true })
	cursus?: string;

	// TODO: might be replaced by an entity relation ?
	@Field(() => Int, { nullable: true })
	promotion?: number;
}
