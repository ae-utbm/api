import { BaseArgs } from '@database/models/base.args';
import { ArgsType, Field, OmitType } from '@nestjs/graphql';

/**
 * Arguments used to filter permissions.
 */
@ArgsType()
export class PermissionArgs extends BaseArgs {
	@Field(() => Boolean, { nullable: true })
	show_revoked = false;

	@Field(() => Boolean, { nullable: true })
	show_expired = false;
}

/**
 * Arguments used to filter permissions, but without the id field.
 */
@ArgsType()
export class PermissionArgsNoId extends OmitType(PermissionArgs, ['id']) {}
