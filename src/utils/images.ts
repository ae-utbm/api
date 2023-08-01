import type { AspectRatio } from '@types';

import { createReadStream, ReadStream } from 'fs';

import sharp from 'sharp';

/**
 * Check if an image has the specified aspect ratio
 * @param {Buffer} buffer The buffer of the image
 * @param {number} aspectRatio The aspect ratio to check (e.g., 1 for square, 1/3 for 1:3 ratio)
 * @returns {boolean} True if the image has the specified aspect ratio, false otherwise
 */
export async function hasAspectRatio(buffer: Buffer, aspectRatio: AspectRatio): Promise<boolean> {
	const { width, height } = await sharp(buffer).metadata();
	const [aspectWidth, aspectHeight] = aspectRatio.split(':').map((s) => parseInt(s, 10));
	return Math.abs(width / height - aspectWidth / aspectHeight) < Number.EPSILON;
}

/**
 * Convert any static image format to webp
 * @param {Buffer} buffer The buffer of the image
 * @returns {Buffer} The buffer of the converted image
 *
 * @info GIF images are not converted
 */
export async function convertToWebp(buffer: Buffer): Promise<Buffer> {
	const { format } = await sharp(buffer).metadata();
	if (format === 'gif' || format === 'webp') return buffer;

	// convert the image to webp otherwise
	return sharp(buffer).webp().toBuffer();
}

/**
 * Get the extension of a file
 * @param {Buffer} buffer The buffer of the file
 * @returns {string} The extension of the file (without the dot)
 */
export async function getFileExtension(buffer: Buffer): Promise<string> {
	const { format } = await sharp(buffer).metadata();
	return format;
}

/**
 * Create a read stream from a file, with a retry mechanism
 * @param {string} path The path to the file
 * @param {number} attempts Number of attempts to try to create the stream @default 10
 * @returns {ReadStream} The read stream
 * @throws {Error} If the file can't be read after all attempts
 */
export function getStreamableFile(path: string, attempts: number = 10): Promise<ReadStream> {
	return new Promise((resolve, reject) => {
		const tryCreateStream = (remainingAttempts: number) => {
			try {
				const stream = createReadStream(path);
				resolve(stream);
			} catch (error) {
				if (remainingAttempts === 0) {
					reject(error);
				} else {
					setTimeout(() => {
						tryCreateStream(remainingAttempts - 1);
					}, 1000);
				}
			}
		};

		tryCreateStream(attempts);
	});
}
