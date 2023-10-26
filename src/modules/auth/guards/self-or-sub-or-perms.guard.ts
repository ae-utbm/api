import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { TranslateService } from '@modules/translate/translate.service';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { SelfOrPermissionGuard } from './self-or-perms.guard';
import { SubscribedGuard } from './subscribed.guard';
import { AuthService } from '../auth.service';

export class SelfOrPermsOrSubGuard extends SelfOrPermissionGuard implements CanActivate {
	constructor(
		override readonly t: TranslateService,
		override readonly jwtService: JwtService,
		override readonly configService: ConfigService,
		override readonly userService: UsersDataService,
		override readonly reflector: Reflector,
		override readonly authService: AuthService,
	) {
		super(t, jwtService, configService, userService, reflector, authService);
	}

	override async canActivate(context: ExecutionContext) {
		return (
			(await SubscribedGuard.checkSubscribed(context, this.authService, this.userService)) ||
			(await super.canActivate(context))
		);
	}
}
