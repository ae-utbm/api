import type { AspectRatio } from '@types';

import { readFileSync } from 'fs';
import { Readable } from 'stream';

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
 * @param {string} filepath The path of the file to get the stream
 * @returns {Readable} The stream of the file
 */
export function toReadable(filepath: string): Readable {
	const readable = new Readable({
		read() {
			// Implement your logic to read data from the file and push it into the stream
			const data = readFileSync(filepath, 'utf-8');
			this.push(data);
			this.push(null); // Signal the end of the stream
		},
	});

	return readable;
}
