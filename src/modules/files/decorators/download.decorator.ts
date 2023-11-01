import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiDownloadFile(description?: string) {
	return applyDecorators(
		ApiResponse({
			status: 200,
			description,
			content: {
				'application/octet-stream': {},
			},
		}),
	);
}
