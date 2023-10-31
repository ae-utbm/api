import type { aspect_ratio } from '#types';

import { randomUUID } from 'crypto';
import { accessSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { fromBuffer, MimeType } from 'file-type';

import { TranslateService } from '@modules/translate/translate.service';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { FileVisibilityGroup } from './entities/file-visibility.entity';
import { File } from './entities/file.entity';
import { ImagesService } from './images.service';

type WriteFileOptions = {
	directory: string;
	filename: string;
};

type WriteImageOptions = WriteFileOptions & {
	aspect_ratio: aspect_ratio;
};

@Injectable()
export class FilesService {
	constructor(
		private readonly orm: MikroORM,
		private readonly t: TranslateService,
		private readonly imagesService: ImagesService,
		private readonly usersDataService: UsersDataService,
	) {}

	/**
	 * Determine if the given user can read the given file.
	 * @param {File} file - The file to check the visibility of.
	 * @param {User} user - The user to check the visibility for.
	 */
	async canReadFile(file: File<unknown>, user: User): Promise<boolean> {
		// If the file has no visibility group, it's public
		await file.visibility?.init();
		if (!file.visibility) return true;

		// File owner can always read his own files
		if (file.owner instanceof User && file.owner.id === user.id) return true;

		// If user has ROOT / CAN_READ_FILE, he can read the file no matter what
		if (await this.usersDataService.hasPermissionOrRoleWithPermission(user.id, false, ['CAN_READ_FILE'])) return true;

		// Check if the user has the correct visibility group to read the file
		await user.files_visibility_groups.init();
		return (
			user.files_visibility_groups
				.getItems()
				.find((g) => g.id === file.visibility.id && g.name === file.visibility.name) !== undefined
		);
	}

	/**
	 * Upload file on disk
	 */
	async writeOnDisk(buffer: Buffer, options: WriteFileOptions, allowedMimetype: MimeType[]) {
		if (!buffer) throw new BadRequestException(this.t.Errors.File.NotProvided());

		const fileType = await fromBuffer(buffer);
		/* istanbul ignore next-line */
		if (!fileType) throw new BadRequestException(this.t.Errors.File.UndefinedMimeType());

		/* istanbul ignore next-line */
		if (!allowedMimetype.includes(fileType.mime))
			throw new BadRequestException(this.t.Errors.File.InvalidMimeType(allowedMimetype));

		const filename = `${options.filename}_${randomUUID()}.${fileType.ext}`;
		const filepath = join(options.directory, filename);
		const size = buffer.byteLength;

		// Scan the file with an antivirus
		// TODO: (KEY: 5) Implement an antivirus (do a specific PR for it, as it's quite a big feature)
		/* istanbul ignore next-line */
		if (await this.scanWithAntivirus(buffer)) throw new BadRequestException(this.t.Errors.File.Infected(filename));

		// Write the file on disk
		mkdirSync(options.directory, { recursive: true });
		writeFileSync(filepath, buffer);

		return {
			mimetype: fileType.mime,
			extension: fileType.ext,
			filename,
			filepath,
			size,
		};
	}

	/**
	 * Upload file on disk, but convert it to webp first
	 * (unless it's a GIF or webp already)
	 * TODO: (KEY: 4) move this function to the images.service.ts file ?
	 */
	async writeOnDiskAsImage(file: Express.Multer.File, options: WriteImageOptions) {
		if (!file) throw new BadRequestException(this.t.Errors.File.NotProvided());

		let buffer = file.buffer;

		if (!file.mimetype.startsWith('image/'))
			throw new BadRequestException(this.t.Errors.File.InvalidMimeType(['image/*']));

		// Check if the file respect the aspect ratio
		if (!(await this.imagesService.validateAspectRatio(buffer, options.aspect_ratio)))
			throw new BadRequestException(this.t.Errors.Image.InvalidAspectRatio(options.aspect_ratio));

		// Convert the file to webp (unless it's a GIF or already a webp)
		buffer = await this.imagesService.convertToWebp(buffer);

		return this.writeOnDisk(buffer, options, ['image/webp', 'image/gif']);
	}

	/**
	 * Scan a file with an Antivirus
	 * TODO: (KEY: 5) Implement an antivirus (do a specific PR for it, as it's quite a big feature)
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private async scanWithAntivirus(buffer: Buffer): Promise<boolean> {
		return new Promise((resolve) => {
			resolve(false);
		});
	}

	/**
	 * Get a visibility group by its name, if no name is provided, it will return the default visibility group (subscriber).
	 * @param {Uppercase<string>} name - The name of the visibility group to get. @default 'SUBSCRIBER'
	 * @returns {Promise<FileVisibilityGroup>} The corresponding visibility group.
	 */
	@CreateRequestContext()
	async getVisibilityGroup(name: Uppercase<string> = 'SUBSCRIBER'): Promise<FileVisibilityGroup> {
		const res = await this.orm.em.findOne(FileVisibilityGroup, { name }, { populate: ['users', 'files'] });
		if (!res) throw new BadRequestException(this.t.Errors.Entity.NotFound(FileVisibilityGroup, name, 'name'));

		return res;
	}

	/**
	 * Delete file on disk
	 * @param {File} file The file to delete
	 * @param {boolean} silent If true, the function will not throw an error if the file doesn't exist
	 */
	deleteFromDisk(file: File<unknown>, silent: boolean = true) {
		try {
			accessSync(file.path);
		} catch {
			if (silent) return;
			throw new NotFoundException(this.t.Errors.File.NotFoundOnDisk(file.filename));
		}

		rmSync(file.path);
	}

	/**
	 * Get the stream of a file
	 * @param {File} file The path of the file to get the stream
	 * @returns {Readable} The stream of the file
	 */
	toReadable(file: File<unknown>): Readable {
		try {
			accessSync(file.path);
		} catch {
			throw new NotFoundException(this.t.Errors.File.NotFoundOnDisk(file.filename));
		}

		const readable = new Readable({
			read() {
				const data = readFileSync(file.path);
				this.push(data);
				this.push(null); // Signal the end of the stream
			},
		});

		return readable;
	}
}
