import { Fn } from "./fn";
import { Option } from "./option";

export type NonEmptyArray<T> = [T, ...T[]];

export const unique = <T>(arr: T[]): T[] =>
	arr.filter((value, index, array) => array.indexOf(value) === index);

export const flat = <T>(arr: T[][]): T[] =>
	arr.reduce((acc, val) => acc.concat(val), []);

export const groupBy = <T, U>(op: Fn<T, U>) =>
	(arr: T[]): Map<U, NonEmptyArray<T>> =>
		arr.reduce((map, val) => {
			const key = op(val);
			const arr = map.get(key)?.concat(val) as Option<NonEmptyArray<T>> ?? [val];
			map.set(key, arr);
			return map;
		}, new Map<U, NonEmptyArray<T>>());
