import { randomInt } from './password';

export {};

declare global {
	interface Array<T> {
		/**
		 * Remove specified items from the array. Removes any duplicates.
		 * @param {T[]} items Items to remove.
		 * @returns {T[]} The array without the specified items.
		 */
		remove(...items: T[]): T[];

		/**
		 * Remove duplicate items from the array.
		 * @returns {T[]} The array without duplicate items.
		 */
		unique(): T[];

		/**
		 * Shuffle the array.
		 * @returns {T[]} The shuffled array.
		 */
		shuffle(): T[];

		/**
		 * Returns true if all objects in the array have the same type.
		 * @returns {boolean} True if all elements in the array have the same type.
		 * @example [].haveEqualObjects() // true
		 * @example [{ a: 1 }, { a: 2 }].haveEqualObjects() // true
		 * @example [{ a: 1 }, { a: 2, b: 'unexpected' }].haveEqualObjects() // false
		 */
		haveEqualObjects(): boolean;
	}
}

if (!Array.prototype.remove) {
	Array.prototype.remove = function <T>(this: T[], ...items: T[]): T[] {
		items.forEach((item) => {
			let index = this.indexOf(item);

			while (index !== -1) {
				this.splice(index, 1);
				index = this.indexOf(item); // Look for the next occurrence.
			}
		});

		return this;
	};
}

if (!Array.prototype.unique) {
	Array.prototype.unique = function <T>(this: T[]): T[] {
		return this.filter((item, index) => this.indexOf(item) === index);
	};
}

if (!Array.prototype.shuffle) {
	Array.prototype.shuffle = function <T>(this: T[]): T[] {
		let currentIndex = this.length;
		let randomIndex = null;

		// While there remain elements to shuffle.
		while (currentIndex > 0) {
			// Pick a remaining element.
			randomIndex = randomInt(currentIndex - 1);
			currentIndex--;

			// And swap it with the current element.
			[this[currentIndex], this[randomIndex]] = [this[randomIndex], this[currentIndex]];
		}

		return this;
	};
}

if (!Array.prototype.haveEqualObjects) {
	Array.prototype.haveEqualObjects = function <T>(this: T[]): boolean {
		if (this.length === 0) return true;
		const keysToHave = Object.keys(this[0]);

		for (let i = 1; i < this.length; i++) {
			const keysToCheck = Object.keys(this[i]);

			if (keysToCheck.length !== keysToHave.length) return false;
			if (!keysToCheck.every((key) => keysToHave.includes(key))) return false;
		}

		return true;
	};
}
