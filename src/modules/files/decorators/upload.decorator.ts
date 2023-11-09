import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

export function ApiUploadFile() {
	return applyDecorators(
		ApiConsumes('multipart/form-data'),
		ApiBody({
			schema: {
				type: 'object',
				properties: {
					file: {
						type: 'string',
						format: 'binary',
					},
				},
			},
		}),
		UseInterceptors(FileInterceptor('file')),
	);
}
