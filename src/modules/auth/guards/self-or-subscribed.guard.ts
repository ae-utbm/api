import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { TranslateService } from '@modules/translate/translate.service';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { SelfGuard } from './self.guard';
import { SubscribedGuard } from './subscribed.guard';
import { AuthService } from '../auth.service';

export class SelfOrSubscribedGuard extends SubscribedGuard implements CanActivate {
	constructor(
		private readonly t: TranslateService,
		override readonly jwtService: JwtService,
		override readonly userService: UsersDataService,
		override readonly reflector: Reflector,
		override readonly authService: AuthService,
	) {
		super(jwtService, userService, reflector, authService);
	}

	override async canActivate(context: ExecutionContext) {
		return SelfGuard.checkSelf(context, this.reflector, this.authService, this.t) || super.canActivate(context);
	}
}
