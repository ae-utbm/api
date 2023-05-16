import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DateObject {
	@Field(() => Int)
	year: number;

	@Field(() => Int)
	month: number;

	@Field(() => Int)
	day: number;

	@Field(() => Int)
	hour: number;

	@Field(() => Int)
	minute: number;

	@Field(() => Int)
	second: number;

	@Field(() => Int)
	millisecond: number;

	@Field(() => Date)
	date: Date;

	constructor(date: Date) {
		this.date = date;
		this.year = date.getFullYear();
		this.month = date.getMonth();
		this.day = date.getDate();
		this.hour = date.getHours();
		this.minute = date.getMinutes();
		this.second = date.getSeconds();
		this.millisecond = date.getMilliseconds();
	}
}
