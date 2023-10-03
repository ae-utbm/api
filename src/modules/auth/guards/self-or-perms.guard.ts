import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { TranslateService } from '@modules/translate/translate.service';
import { UsersService } from '@modules/users/users.service';

import { PermissionGuard } from './permission.guard';
import { SelfGuard } from './self.guard';
import { AuthService } from '../auth.service';

@Injectable()
export class SelfOrPermissionGuard extends PermissionGuard implements CanActivate {
	constructor(
		private readonly t: TranslateService,
		override readonly jwtService: JwtService,
		override readonly configService: ConfigService,
		override readonly userService: UsersService,
		override readonly reflector: Reflector,
		override readonly authService: AuthService,
	) {
		super(jwtService, configService, userService, reflector, authService);
	}

	override async canActivate(context: ExecutionContext) {
		return SelfGuard.checkSelf(context, this.reflector, this.authService, this.t) || super.canActivate(context);
	}
}
