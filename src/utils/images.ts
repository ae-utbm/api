import { createReadStream, ReadStream } from 'fs';

import sharp from 'sharp';

/**
 * Check if an image is square
 * @param {string} buffer The path to the image
 * @returns {boolean} True if the image is square, false otherwise
 */
export async function isSquare(buffer: Buffer): Promise<boolean> {
	const { width, height } = await sharp(buffer).metadata();
	return width === height;
}

/**
 * Determine if the image is using a 1:3 aspect ratio
 * @param {Buffer} buffer The path to the image
 * @returns {boolean} True if the image is using a 1:3 aspect ratio, false otherwise
 */
export async function isBannerAspectRation(buffer: Buffer): Promise<boolean> {
	const { width, height } = await sharp(buffer).metadata();
	return width / height === 1 / 3;
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
