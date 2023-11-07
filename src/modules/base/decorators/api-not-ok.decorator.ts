import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

type HttpStatus = 400 | 401 | 403 | 404;
type ApiHttpErrors = {
	[key in HttpStatus]: string;
};

export function ApiNotOkResponses(errors: Partial<ApiHttpErrors>) {
	return applyDecorators(
		...Object.keys(errors).map((key) => {
			return ApiResponse({
				description: errors[key],
				status: key,
			});
		}),
	);
}
