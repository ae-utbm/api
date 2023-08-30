import { Module } from '@nestjs/common';

import { TranslateService } from '@modules/translate/translate.service';

import { EmailsService } from './emails.service';

@Module({
	imports: [],
	providers: [EmailsService, TranslateService],
	exports: [EmailsService],
})
export class EmailsModule {}
