import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { PermissionGuard } from './permission.guard';
import { checkSelf } from './self.guard';

@Injectable()
export class SelfOrPermissionGuard extends PermissionGuard implements CanActivate {
	override async canActivate(context: ExecutionContext) {
		return checkSelf(context, this.reflector, this.authService) || super.canActivate(context);
	}
}
