import { createReadStream, ReadStream, rmSync } from 'fs';

import sharp from 'sharp';

/**
 * Check if an image is square
 * @param {string} imagePath The path to the image
 * @returns {boolean} True if the image is square, false otherwise
 */
export async function isSquare(imagePath: string): Promise<boolean> {
	const { width, height } = await sharp(imagePath).metadata();
	return width === height;
}

/**
 * Determine if the image is using a 1:3 aspect ratio
 * @param {string} imagePath The path to the image
 * @returns {boolean} True if the image is using a 1:3 aspect ratio, false otherwise
 */
export async function isBannerAspectRation(imagePath: string): Promise<boolean> {
	const { width, height } = await sharp(imagePath).metadata();
	return width / height === 1 / 3;
}

/**
 * Convert any static image format to webp
 * @param {string} imagePath The path to the image
 * @returns {string} The path to the converted image
 *
 * @info GIF images are not converted
 */
export async function convertToWebp(imagePath: string): Promise<string> {
	const { format } = await sharp(imagePath).metadata();
	if (format === 'gif' || format === 'webp') return imagePath;

	const newPath = imagePath.replace(/\.[^/.]+$/, '.webp');

	// convert the image to webp
	const buffer = await sharp(imagePath).toBuffer();
	sharp(buffer)
		.webp()
		.toFile(newPath, (err, info) => {
			// delete the old image
			if (!err && info) rmSync(imagePath);
		});

	return newPath;
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
