import type { aspect_ratio } from '#types';

import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImagesService {
	async validateAspectRatio(buffer: Buffer, aspect_ratio: aspect_ratio): Promise<boolean> {
		const { width, height } = await sharp(buffer).metadata();
		const [aspectWidth, aspectHeight] = aspect_ratio.split(':').map((s) => parseInt(s, 10));
		return Math.abs(width / height - aspectWidth / aspectHeight) < Number.EPSILON;
	}

	async convertToWebp(buffer: Buffer): Promise<Buffer> {
		const { format } = await sharp(buffer).metadata();
		/* istanbul ignore next-line */
		if (format === 'gif' || format === 'webp') return buffer;

		// convert the image to webp otherwise
		return sharp(buffer).webp().toBuffer();
	}
}
