import { BadRequestException, NotFoundException } from '@nestjs/common';

import { FileVisibilityGroup } from '@modules/files/entities/file-visibility.entity';
import { FilesService } from '@modules/files/files.service';
import { PromotionPicture } from '@modules/promotions/entities/promotion-picture.entity';
import { Promotion } from '@modules/promotions/entities/promotion.entity';

import { orm, module_fixture, t } from '../..';

describe('FilesService (unit)', () => {
	let filesService: FilesService;
	let em: typeof orm.em;

	let fake_file: PromotionPicture;

	beforeAll(async () => {
		em = orm.em.fork();
		filesService = module_fixture.get<FilesService>(FilesService);

		const f = em.create(PromotionPicture, {
			filename: 'test.webp',
			mimetype: 'image/webp',
			description: 'test file',
			path: '/foo/bar/does_not_exist.webp',
			picture_promotion: em.getReference(Promotion, 1),
			size: 0,
		});

		await em.persistAndFlush(f);
		fake_file = await em.findOneOrFail(PromotionPicture, { picture_promotion: 1 });
	});

	afterAll(async () => {
		await em.removeAndFlush(fake_file);
	});

	describe('.canReadFile()', () => {
		it('should return true when the file does not have a visibility group', async () => {
			expect(await filesService.canReadFile(fake_file, undefined)).toBe(true);
		});
	});

	describe('.toReadable()', () => {
		it('should throw when the file cannot be accessed', () => {
			expect(() => {
				filesService.toReadable(fake_file);
			}).toThrow(new NotFoundException(t.Errors.File.NotFoundOnDisk(fake_file.filename)));
		});
	});

	describe('.deleteFromDisk()', () => {
		it('should silently return when asked & the file does not exist', () => {
			expect(filesService.deleteFromDisk(fake_file)).toBe(undefined);
		});

		it('should throw when asked if the file does not exist', () => {
			expect(() => {
				filesService.deleteFromDisk(fake_file, false);
			}).toThrow(new NotFoundException(t.Errors.File.NotFoundOnDisk(fake_file.filename)));
		});
	});

	describe('.getVisibilityGroup()', () => {
		it('should throw a bad request exception when the visibility group does not exist', async () => {
			await expect(filesService.getVisibilityGroup('FOO_BAR')).rejects.toThrow(
				new BadRequestException(t.Errors.Entity.NotFound(FileVisibilityGroup, 'FOO_BAR', 'name')),
			);
		});
	});

	describe('.writeOnDiskAsImage()', () => {
		it('should throw if nof file is provided', async () => {
			await expect(
				filesService.writeOnDiskAsImage(undefined, {
					directory: 'string',
					filename: 'string',
					aspect_ratio: '1:1',
				}),
			).rejects.toThrow(new BadRequestException(t.Errors.File.NotProvided()));
		});
	});

	describe('.writeOnDisk()', () => {
		it('should throw if no file is provided', async () => {
			await expect(
				filesService.writeOnDisk(
					undefined,
					{
						directory: 'string',
						filename: 'string',
					},
					['image/png'],
				),
			).rejects.toThrow(new BadRequestException(t.Errors.File.NotProvided()));
		});
	});
});
