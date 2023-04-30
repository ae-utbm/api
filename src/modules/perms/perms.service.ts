import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Permission } from './entities/permission.entity';
import { PERMISSIONS, TPermission } from './decorators/perms.decorator';

@Injectable()
export class PermissionsService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	async addPermission(name: TPermission, user_id: number, expires: Date) {
		const user = await this.orm.em.findOneOrFail(User, { id: user_id });
		const perm = PERMISSIONS.find((p) => p.name === name);

		const permission = this.orm.em.create(Permission, { ...perm, user, expires });
		await this.orm.em.persistAndFlush(permission);
		return permission;
	}
}
