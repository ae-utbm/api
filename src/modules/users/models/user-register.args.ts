import { ArgsType, Field } from '@nestjs/graphql';
import { UserEditArgs } from './user-edit.args';

@ArgsType()
export class UserRegisterArgs extends UserEditArgs {
	id: never;

	@Field(() => String)
	password: string;

	@Field(() => String)
	email: string;

	@Field(() => Date)
	birthday: Date;

	@Field(() => String)
	first_name: string;

	@Field(() => String)
	last_name: string;
}
