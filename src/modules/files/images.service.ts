import type { aspect_ratio } from '#types';

import { Injectable } from '@nestjs/common';
import { fromBuffer } from 'file-type';
import sharp from 'sharp';

import { i18nBadRequestException } from '@modules/base/http-errors';

import { FilesService, WriteFileOptions } from './files.service';

type WriteImageOptions = WriteFileOptions & {
	aspect_ratio: aspect_ratio;
};

@Injectable()
export class ImagesService extends FilesService {
	async validateAspectRatio(buffer: Buffer, aspect_ratio: aspect_ratio): Promise<boolean> {
		const { width, height } = await sharp(buffer).metadata();
		const [aspectWidth, aspectHeight] = aspect_ratio.split(':').map((s) => parseInt(s, 10));
		return Math.trunc((width / height) * 100) / 100 === Math.trunc((aspectWidth / aspectHeight) * 100) / 100;
	}

	async convertToWebp(buffer: Buffer): Promise<Buffer> {
		const { format } = await sharp(buffer).metadata();
		/* istanbul ignore next-line */
		if (format === 'gif' || format === 'webp') return buffer;

		// convert the image to webp otherwise
		return sharp(buffer).webp().toBuffer();
	}

	/**
	 * Upload file on disk, but convert it to webp first
	 * (unless it's a GIF or webp already)
	 */
	override async writeOnDisk(buffer: Buffer, options: WriteImageOptions) {
		if (!buffer) throw new i18nBadRequestException('validations.file.invalid.not_provided');

		const fileType = await fromBuffer(buffer);

		if (!fileType || !fileType.mime.startsWith('image/'))
			throw new i18nBadRequestException('validations.file.invalid.unauthorized_mime_type', { mime_types: 'image/*' });

		// Check if the file respect the asked aspect ratio
		if (!(await this.validateAspectRatio(buffer, options.aspect_ratio)))
			throw new i18nBadRequestException('validations.image.invalid.aspect_ratio', {
				aspect_ratio: options.aspect_ratio,
			});

		buffer = await this.convertToWebp(buffer);

		return super.writeOnDisk(buffer, options, ['image/webp', 'image/gif']);
	}
}
