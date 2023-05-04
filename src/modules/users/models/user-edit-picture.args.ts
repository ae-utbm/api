import { BaseArgs } from '@database/models/base.args';
import { ArgsType, Field } from '@nestjs/graphql';
import { FileUpload } from '@types';
import { GraphQLUpload } from 'graphql-upload-minimal';

@ArgsType()
export class UserEditImageArgs extends BaseArgs {
	@Field(() => String)
	name: string;

	@Field(() => GraphQLUpload)
	image: Promise<FileUpload>;
}
