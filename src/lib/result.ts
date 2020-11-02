import { none, Option } from "./option";
import { panic } from "./err";
import { AsyncResult, AsyncResultErr, AsyncResultOk } from "./result/async";
import { Fn } from "./fn";
import { Future } from "./future";

export class Result<T, E, OK extends boolean = boolean> {
	protected constructor(private readonly _ok: OK, private readonly _val: T | E) {
	}

	static ok<T>(val: T, display = false): ResultOk<T> {
		if (display) {
			console.log("OK: ", val);
		}
		return new Result<T, any, true>(true, val);
	}

	static err<E>(err: E, display = false): ResultErr<E> {
		if (display) {
			console.log("Err: ", err);
		}
		return new Result<any, E, false>(false, err);
	}

	isOk(): this is ResultOk<T> {
		return this._ok;
	}
	isErr(): this is ResultErr<E> {
		return !this._ok;
	}
	ok(): Option<T> {
		return this._ok ? (this._val as T) : none;
	}
	err(): Option<E> {
		return this._ok ? none : (this._val as E);
	}

	map<U>(op: Fn<T, U>): Result<U, E, OK> {
		return (this._ok ? Result.ok(op(this._val as T)) : this) as Result<U, E, OK>;
	}
	mapOr<U>(def: U, op: Fn<T, U>): U {
		return this._ok ? op(this._val as T) : def;
	}
	mapOrElse<U>(def: Fn<E, U>, op: Fn<T, U>): U {
		return this._ok ? op(this._val as T) : def(this._val as E);
	}
	mapErr<F>(op: Fn<E, F>): Result<T, F, OK> {
		return (this._ok ? this : Result.err(op(this._val as E))) as Result<T, F, OK>;
	}

	and<U>(res: Result<U, E>): Result<U, E> {
		return this._ok ? res : this as ResultErr<E>;
	}
	andThen<U>(op: Fn<T, Result<U, E>>): Result<U, E> {
		return this._ok ? op(this._val as T) : this as ResultErr<E>;
	}

	or<F>(res: Result<T, F>): Result<T, F> {
		return this._ok ? this as ResultOk<T> : res;
	}
	orElse<F>(op: Fn<E, Result<T, F>>): Result<T, F> {
		return this._ok ? this as ResultOk<T> : op(this._val as E);
	}

	unwrapOr(def: T): T {
		return this._ok ? this._val as T : def;
	}
	unwrapOrElse(op: Fn<E, T>): T {
		return this._ok ? this._val as T : op(this._val as E);
	}

	unwrap(msg?: string): T {
		return this._ok ? this._val as T : panic(msg ?? "Expected Ok, got Err", this._val);
	}
	unwrapErr(msg?: string): E {
		return this._ok ? panic(msg ?? "Expected Err, got Ok", this._val) : this._val as E;
	}

	async(): AsyncResult<T, E> {
		return new AsyncResult(resolve => resolve(this));
	}
	mapAsync<U>(op: Fn<T, Future<U>>): AsyncResult<U, E, OK> {
		return (this._ok ?
			AsyncResult.fromFuture(op(this._val as T).then(Result.ok)) :
			this.async()) as AsyncResult<U, E, OK>;
	}
	mapErrAsync<F>(op: Fn<E, Future<F>>): AsyncResult<T, F, OK> {
		return (this._ok ?
			this.async() :
			AsyncResult.fromFuture(op(this._val as E).then(Result.err))) as AsyncResult<T, F, OK>;
	}
	andAsync<U>(res: AsyncResult<U, E>): AsyncResult<U, E> {
		return this._ok ? res : this.async() as AsyncResultErr<E>;
	}
	andThenAsync<U>(op: Fn<T, AsyncResult<U, E>>): AsyncResult<U, E> {
		return this._ok ? op(this._val as T) : this.async() as AsyncResultErr<E>;
	}
	orAsync<F>(res: AsyncResult<T, F>): AsyncResult<T, F> {
		return this._ok ? this.async() as AsyncResultOk<T> : res;
	}
	orElseAsync<F>(op: Fn<E, AsyncResult<T, F>>): AsyncResult<T, F> {
		return this._ok ? this.async() as AsyncResultOk<T> : op(this._val as E);
	}
}

export type ResultOk<T> = Result<T, any, true>;
export type ResultErr<E> = Result<any, E, false>;

export const Ok = Result.ok;
export const Err = Result.err;
