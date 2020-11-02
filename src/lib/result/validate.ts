import { Fn, IsFn } from "../fn";
import { Result } from "../result";

type Validator = {
	<T, U extends T, E>(predicate: IsFn<T, U>, def: E): Fn<T, Result<U, E>>
	<T, E>(predicate: Fn<T, boolean>, def: E): Fn<T, Result<T, E>>
};

export const validate: Validator = <T, U extends T, E>(predicate: IsFn<T, U> | Fn<T, boolean>, def: E): Fn<T, Result<U, E>> =>
	(val: T) =>
		predicate(val) ? Result.ok(val): Result.err(def);

export const not = <T>(predicate: Fn<T, boolean>): Fn<T, boolean> =>
	(val: T) =>
		!predicate(val);
