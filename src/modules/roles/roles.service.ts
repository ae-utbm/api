import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
	constructor(private readonly orm: MikroORM) {}

	@UseRequestContext()
	getAllRoles() {
		return this.orm.em.find(Role, {});
	}

	getUserRoles() {
		throw new Error('Method not implemented.');
	}

	createRole(input: Partial<Role>) {
		throw new Error('Method not implemented.');
	}
}
