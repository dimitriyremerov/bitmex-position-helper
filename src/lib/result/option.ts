import { isSome, Option } from "../option";
import { AsyncResult, AsyncOk, AsyncErr } from "./async";
import { Ok, Result, Err } from "../result";

export const res = <T, E>(option: Option<T>, def: E): Result<T, E> =>
	isSome(option) ? Ok(option) : Err(def);

export const asyncRes = <T, E>(option: Option<T>, def: E): AsyncResult<T, E> =>
	isSome(option) ? AsyncOk(option) : AsyncErr(def);
