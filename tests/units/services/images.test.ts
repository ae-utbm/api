import { i18nBadRequestException } from '@modules/_mixin/http-errors';
import { ImagesService } from '@modules/files/images.service';

import { module_fixture } from '../..';

describe('ImagesService (unit)', () => {
	let imagesService: ImagesService;

	beforeAll(() => {
		imagesService = module_fixture.get<ImagesService>(ImagesService);
	});

	describe('.writeOnDisk()', () => {
		it('should throw if no file is provided', async () => {
			await expect(
				imagesService.writeOnDisk(undefined, {
					directory: 'string',
					filename: 'string',
					aspect_ratio: '1:1',
				}),
			).rejects.toThrow(new i18nBadRequestException('validations.file.invalid.not_provided'));
		});
	});
});
