import { ArgsType, Field, OmitType } from '@nestjs/graphql';
import { UserEditArgs } from './user-edit.args';

@ArgsType()
export class UserRegisterArgs extends OmitType(UserEditArgs, ['id']) {
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
