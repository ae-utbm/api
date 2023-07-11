import { Migration } from '@mikro-orm/migrations';

export class Migration20230502154016 extends Migration {
	async up(): Promise<void> {
		this.addSql(
			'create table "users" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "birthday" timestamptz(0) not null);',
		);

		this.addSql(
			'create table "refresh_tokens" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "is_revoked" boolean not null default false, "expires_at" timestamptz(0) not null, "user_id" int not null);',
		);

		this.addSql(
			'create table "permissions" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "name" varchar(255) not null, "is_revoked" boolean not null default false, "expires_at" timestamptz(0) not null, "user_id" int not null);',
		);

		this.addSql(
			'alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;',
		);

		this.addSql(
			'alter table "permissions" add constraint "permissions_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;',
		);
	}
}
