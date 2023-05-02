import { Field, InputType } from '@nestjs/graphql';
import { UserObject } from './user.model';

@InputType('UserEditInput')
export class UserEditInput extends UserObject {
	@Field({ nullable: true })
	password: string;
}
