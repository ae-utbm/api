import '@utils/index';

describe('Array', () => {
	describe('remove', () => {
		it('should remove the specified items from the array', () => {
			const array = [1, 2, 3, 4, 5];
			expect(array.remove(1, 2, 3)).toEqual([4, 5]);
		});

		it('should not remove anything if the specified items are not in the array', () => {
			const array = [1, 2, 3, 4, 5];
			expect(array.remove(6, 7, 8)).toEqual([1, 2, 3, 4, 5]);
			expect([].remove(1, 2, 3)).toEqual([]);
		});

		it('should remove any duplicates', () => {
			const array = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
			expect(array.remove(1, 2, 3)).toEqual([4, 5, 4, 5]);
		});
	});

	describe('haveEqualObjects', () => {
		it('should return true if all objects in the array have the same type', () => {
			expect([].haveEqualObjects()).toBe(true);
			expect([{ a: 1 }, { a: 2 }].haveEqualObjects()).toBe(true);
		});

		it('should return false if not all objects in the array have the same type', () => {
			expect([{ a: 1 }, { a: 2, b: 'unexpected' }].haveEqualObjects()).toBe(false);
			expect(
				[
					{ a: 1, c: 2 },
					{ a: 3, b: 'unexpected' },
				].haveEqualObjects(),
			).toBe(false);
		});
	});
});
