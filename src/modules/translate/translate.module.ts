import { Module } from '@nestjs/common';

import { TranslateService } from './translate.service';

@Module({
	imports: [],
	providers: [TranslateService],
	exports: [TranslateService],
})
export class TranslateModule {}
