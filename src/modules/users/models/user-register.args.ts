import { ArgsType, Field, OmitType } from '@nestjs/graphql';
import { UserEditArgs } from './user-edit.args';

@ArgsType()
export class UserRegisterArgs extends OmitType(UserEditArgs, ['id']) {
	@Field(() => String)
	override password: string;

	@Field(() => String)
	override email: string;

	@Field(() => Date)
	birthday: Date;

	@Field(() => String)
	override first_name: string;

	@Field(() => String)
	override last_name: string;
}
