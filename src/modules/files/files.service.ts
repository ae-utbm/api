import { randomUUID } from 'crypto';
import { accessSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

import { MikroORM, CreateRequestContext } from '@mikro-orm/core';
import { Injectable, StreamableFile } from '@nestjs/common';
import { fromBuffer, MimeType } from 'file-type';

import { i18nBadRequestException, i18nNotFoundException, i18nUnauthorizedException } from '@modules/base/http-errors';
import { User } from '@modules/users/entities/user.entity';
import { UsersDataService } from '@modules/users/services/users-data.service';

import { FileVisibilityGroup } from './entities/file-visibility.entity';
import { File } from './entities/file.entity';

export type WriteFileOptions = {
	directory: string;
	filename: string;
};

@Injectable()
export class FilesService {
	constructor(private readonly orm: MikroORM, private readonly usersDataService: UsersDataService) {}

	/**
	 * Return a file as a StreamableFile
	 * @param {File<unknown>} file the file to get as a stream
	 * @param {number} user_id the user id who wants to get the file
	 *
	 * @throws {i18nUnauthorizedException} if the user is not allowed to read the file
	 */
	async getAsStreamable(file: File<unknown>, user_id: number): Promise<StreamableFile> {
		if (!(await this.canReadFile(file, user_id)))
			throw new i18nUnauthorizedException('validations.user.invalid.not_in_file_visibility_group', {
				group_name: file.visibility?.name,
			});

		return new StreamableFile(this.toReadable(file));
	}

	/**
	 * Determine if the given user can read the given file.
	 * @param {File<unknown>} file - The file to check the visibility of.
	 * @param {number} userId - The user to check the visibility for.
	 */
	async canReadFile(file: File<unknown>, userId: number): Promise<boolean> {
		// If the file has no visibility group, it's public
		await file.visibility?.init();
		if (!file.visibility) return true;

		// File owner can always read his own files
		if (file.owner instanceof User && file.owner.id === userId) return true;

		// If user has ROOT / CAN_READ_FILE, he can read the file no matter what
		if (await this.usersDataService.hasPermissionOrRoleWithPermission(userId, false, ['CAN_READ_FILE'])) return true;

		// Check if the user has the correct visibility group to read the file
		const user = await this.orm.em.findOne(User, { id: userId }, { populate: ['files_visibility_groups'] });

		return (
			user.files_visibility_groups
				.getItems()
				.find((g) => g.id === file.visibility.id && g.name === file.visibility.name) !== undefined
		);
	}

	/**
	 * Write file on disk
	 * @param {Buffer} buffer The file buffer
	 * @param {WriteFileOptions} options The options to write the file
	 * @param {MimeType[]} allowedMimetype The allowed MIME types
	 */
	async writeOnDisk(buffer: Buffer, options: WriteFileOptions, allowedMimetype: MimeType[]) {
		if (!buffer) throw new i18nBadRequestException('validations.file.invalid.not_provided');

		const fileType = await fromBuffer(buffer);
		/* istanbul ignore next-line */
		if (!fileType || !fileType.mime) throw new i18nBadRequestException('validations.file.invalid.no_mime_type');

		/* istanbul ignore next-line */
		if (!allowedMimetype.includes(fileType.mime))
			throw new i18nBadRequestException('validations.file.invalid.unauthorized_mime_type', {
				mime_types: allowedMimetype.join("', '"),
			});

		const filename = `${options.filename}_${randomUUID()}.${fileType.ext}`;
		const filepath = join(options.directory, filename);
		const size = buffer.byteLength;

		// Scan the file with an antivirus
		// TODO: (KEY: 5) Implement an antivirus (do a specific PR for it, as it's quite a big feature)
		/* istanbul ignore next-line */
		if (await this.scanWithAntivirus(buffer)) throw new i18nBadRequestException('validations.file.invalid.infected');

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
		if (!res) throw new i18nBadRequestException('validations.file_visibility_group.invalid.not_found', { name });

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
			throw new i18nNotFoundException('validations.file.invalid.not_found', {
				filename: file.filename,
			});
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
			throw new i18nNotFoundException('validations.file.invalid.not_found', {
				filename: file.filename,
			});
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
