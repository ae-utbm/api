export {};

declare global {
	interface Array<T> {
		/**
		 * Remove specified items from the array.
		 * @param {T[]} items Items to remove.
		 * @returns {T[]} The array without the specified items.
		 */
		remove(...items: T[]): T[];

		/**
		 * Returns true if all objects in the array have the same type.
		 * @returns {boolean} True if all elements in the array have the same type.
		 * @example [{ a: 1 }, { a: 2 }].haveEqualObjects() // true
		 * @example [{ a: 1 }, { a: 2, b: 'unexpected' }].haveEqualObjects() // false
		 */
		haveEqualObjects(): boolean;
	}
}

if (!Array.prototype.remove) {
	Array.prototype.remove = function <T>(this: T[], ...items: T[]): T[] {
		items.forEach((item) => {
			const index = this.indexOf(item);

			if (index !== -1) this.splice(index, 1);
		});

		return this;
	};
}

if (!Array.prototype.haveEqualObjects) {
	Array.prototype.haveEqualObjects = function <T>(this: T[]): boolean {
		const keysToHave = Object.keys(this[0]);

		for (let i = 1; i < this.length; i++) {
			const keysToCheck = Object.keys(this[i]);

			if (keysToCheck.length !== keysToHave.length) return false;
			if (!keysToCheck.every((key) => keysToHave.includes(key))) return false;
		}

		return true;
	};
}
