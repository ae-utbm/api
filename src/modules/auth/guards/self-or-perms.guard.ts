import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { UsersDataService } from '@modules/users/services/users-data.service';

import { PermissionGuard } from './permission.guard';
import { SelfGuard } from './self.guard';
import { AuthService } from '../auth.service';

@Injectable()
export class SelfOrPermissionGuard extends PermissionGuard implements CanActivate {
	constructor(
		override readonly jwtService: JwtService,
		override readonly userService: UsersDataService,
		override readonly reflector: Reflector,
		override readonly authService: AuthService,
	) {
		super(jwtService, userService, reflector, authService);
	}

	override async canActivate(context: ExecutionContext) {
		return SelfGuard.checkSelf(context, this.reflector, this.authService) || super.canActivate(context);
	}
}
