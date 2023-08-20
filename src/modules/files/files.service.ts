import type { I18nTranslations, aspect_ratio } from '@types';

import { randomUUID } from 'crypto';
import { accessSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { Errors } from '@i18n';
import { User } from '@modules/users/entities/user.entity';
import { convertToWebp, getImageFileExtension, hasAspectRatio } from '@utils/images';

import { FileVisibilityGroup } from './entities/file-visibility.entity';
import { File } from './entities/file.entity';

type WriteFileOptions = {
	directory: string;
	filename: string;
};

type WriteImageOptions = WriteFileOptions & {
	aspectRatio: aspect_ratio;
};

@Injectable()
export class FilesService {
	constructor(private readonly orm: MikroORM, private readonly i18n: I18nService<I18nTranslations>) {}

	/**
	 * Determine if the given user can read the given file.
	 * @param {File} file - The file to check the visibility of.
	 * @param {User} user - The user to check the visibility for.
	 */
	async canReadFile(file: File, user: User): Promise<boolean> {
		if (file.is_public) return true;
		if (file.is_hidden) return false;

		// If user is ROOT / CAN_READ_FILE, he can read the file no matter what
		await user.permissions.init();
		const perms = user.permissions.getItems();
		if (perms.some((perm) => perm.name === 'ROOT' || perm.name === 'CAN_READ_FILE')) return true;

		await user.files_visibility_groups.init();

		const fileGroup = file.visibility;
		const userGroups = user.files_visibility_groups.getItems();

		// File owner can always read his own files
		if ('user' in file && 'id' in (file.user as User) && user.id === (file.user as User).id) return true;

		return userGroups.includes(fileGroup);
	}

	/**
	 * Upload file on disk
	 */
	async writeOnDisk(buffer: Buffer, options: WriteFileOptions) {
		if (!buffer) throw new BadRequestException(Errors.File.NotProvided({ i18n: this.i18n }));

		// TODO: find another way to get the file extension (might break for non-image files)
		const extension = await getImageFileExtension(buffer);
		const filename = `${options.filename}_${randomUUID()}.${extension}`;
		const filepath = join(options.directory, filename);
		const size = buffer.byteLength;

		// Write the file on disk
		mkdirSync(options.directory, { recursive: true });
		writeFileSync(filepath, buffer);

		return {
			extension,
			filename,
			filepath,
			size,
		};
	}

	/**
	 * Upload file on disk, but convert it to webp first
	 * (unless it's a GIF or webp already)
	 */
	async writeOnDiskAsImage(file: Express.Multer.File, options: WriteImageOptions) {
		if (!file) throw new BadRequestException(Errors.File.NotProvided({ i18n: this.i18n }));

		let buffer = file.buffer;

		if (!file.mimetype.startsWith('image/'))
			throw new BadRequestException(Errors.Image.InvalidMimeType({ i18n: this.i18n }));

		// Check if the file respect the aspect ratio
		if (!(await hasAspectRatio(buffer, options.aspectRatio)))
			throw new BadRequestException(
				Errors.Image.InvalidAspectRatio({ i18n: this.i18n, aspect_ratio: options.aspectRatio }),
			);

		// Convert the file to webp (unless it's a GIF or already a webp)
		buffer = await convertToWebp(buffer);

		return this.writeOnDisk(buffer, options);
	}

	/**
	 * Get a visibility group by its name, if no name is provided, it will return the default visibility group (subscriber).
	 * @param {Uppercase<string>} name - The name of the visibility group to get. @default 'SUBSCRIBER'
	 * @returns {Promise<FileVisibilityGroup>} The corresponding visibility group.
	 */
	@UseRequestContext()
	async getVisibilityGroup(name: Uppercase<string> = 'SUBSCRIBER'): Promise<FileVisibilityGroup> {
		const res = await this.orm.em.findOne(FileVisibilityGroup, { name }, { populate: ['users', 'files'] });
		if (!res)
			throw new BadRequestException(
				Errors.Generic.NotFound({ i18n: this.i18n, type: FileVisibilityGroup, value: name, field: 'name' }),
			);

		return res;
	}

	/**
	 * Delete file on disk
	 * @param {File} file The file to delete
	 * @param {boolean} silent If true, the function will not throw an error if the file doesn't exist
	 */
	deleteOnDisk(file: File, silent: boolean = true) {
		try {
			accessSync(file.path);
		} catch {
			if (silent) return;
			throw new NotFoundException(Errors.File.NotFoundOnDisk({ i18n: this.i18n, file: file.filename }));
		}

		rmSync(file.path);
	}

	/**
	 * Get the stream of a file
	 * @param {File} file The path of the file to get the stream
	 * @returns {Readable} The stream of the file
	 */
	toReadable(file: File): Readable {
		const i18n = this.i18n;

		try {
			accessSync(file.path);
		} catch {
			throw new NotFoundException(Errors.File.NotFoundOnDisk({ i18n, file: file.filename }));
		}

		const readable = new Readable({
			read() {
				const data = readFileSync(file.path, 'utf-8');
				this.push(data);
				this.push(null); // Signal the end of the stream
			},
		});

		return readable;
	}
}