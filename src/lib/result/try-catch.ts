import { Fn } from "../fn";
import { Result, Ok, Err } from "../result";
import { panic } from "../err";

export const tryCatch = <T, E>(op: Fn<void, T>, def: E): Result<T, E> => {
	try {
		return Ok(op());
	} catch {
		return Err(def);
	}
};

export const tryPanic = <T>(op: Fn<void, T>, msg: string): T => {
	try {
		return op();
	} catch (e) {
		return panic(msg, e);
	}
};
