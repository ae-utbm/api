import sharp from 'sharp';
import fs from 'fs';

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
	await sharp(imagePath).webp({ quality: 80 }).toFile(newPath);

	// delete the old image
	fs.unlinkSync(imagePath);
	return newPath;
}
