import { Result } from "../result";
import { Option } from "../option";
import { Fn } from "../fn";
import { Future, Executor } from "../future";

export class AsyncResult<T, E, OK extends boolean = boolean> extends Future<Result<T, E>> {
	public constructor(protected readonly executor: Executor<Result<T, E>>) {
		super(executor);
	}

	static ok<T, E>(val: T): AsyncResultOk<T> {
		return Result.ok<T>(val).async();
	}

	static err<T, E>(err: E): AsyncResultErr<E> {
		return Result.err<E>(err).async();
	}

	isOk(): Future<boolean> {
		return this.then(result => result.isOk());
	}
	isErr(): Future<boolean> {
		return this.then(result => result.isErr());
	}
	ok(): Future<Option<T>> {
		return this.then(result => result.ok());
	}
	err(): Future<Option<E>> {
		return this.then(result => result.err());
	}

	map<U>(op: Fn<T, U>): AsyncResult<U, E, OK> {
		return this._then(result => result.map(op));
	}
	mapOr<U>(def: U, op: Fn<T, U>): Future<U> {
		return this.then(result => result.mapOr(def, op));
	}
	mapOrElse<U>(def: Fn<E, U>, op: Fn<T, U>): Future<U> {
		return this.then(result => result.mapOrElse(def, op));
	}
	mapErr<F>(op: Fn<E, F>): AsyncResult<T, F, OK> {
		return this._then(result => result.mapErr(op));
	}

	and<U>(res: Result<U, E>): AsyncResult<U, E> {
		return this._then(result => result.and(res));
	}
	andThen<U>(op: Fn<T, Result<U, E>>): AsyncResult<U, E> {
		return this._then(result => result.andThen(op));
	}

	or<F>(res: Result<T, F, OK>): AsyncResult<T, F> {
		return this._then(result => result.or(res));
	}
	orElse<F>(op: Fn<E, Result<T, F>>): AsyncResult<T, F> {
		return AsyncResult.fromFuture(this.then(result => result.orElse(op)));
	}

	unwrapOr(def: T): Future<T> {
		return this.then(result => result.unwrapOr(def));
	}
	unwrapOrElse(op: Fn<E, T>): Future<T> {
		return this.then(result => result.unwrapOrElse(op));
	}

	unwrap(msg?: string): Future<T> {
		return this.then(result => result.unwrap(msg));
	}
	unwrapErr(msg?: string): Future<E> {
		return this.then(result => result.unwrapErr(msg));
	}

	async(): this {
		return this;
	}
	mapAsync<U>(op: Fn<T, Future<U>>): AsyncResult<U, E, OK> {
		return this._thenAsync(result => result.mapAsync(op));
	}
	mapErrAsync<F>(op: Fn<E, Future<F>>): AsyncResult<T, F, OK> {
		return this._thenAsync(result => result.mapErrAsync(op));
	}
	andAsync<U>(res: AsyncResult<U, E>): AsyncResult<U, E> {
		return this._thenAsync(result => result.andAsync(res));
	}
	andThenAsync<U>(op: Fn<T, AsyncResult<U, E>>): AsyncResult<U, E> {
		return this._thenAsync(result => result.andThenAsync(op));
	}
	orAsync<F>(res: AsyncResult<T, F>): AsyncResult<T, F> {
		return this._thenAsync(result => result.orAsync(res));
	}	
	orElseAsync<F>(op: Fn<E, AsyncResult<T, F>>): AsyncResult<T, F> {
		return this._thenAsync(result => result.orElseAsync(op));
	}

	static fromFuture<T, E, OK extends boolean = boolean>(future: Future<Result<T, E, OK>>): AsyncResult<T, E, OK> {
		return new AsyncResult(resolve => future.start(resolve));
	}
	private _then<U, F>(op: Fn<Result<T, E>, Result<U, F>>): AsyncResult<U, F> {
		return AsyncResult.fromFuture(this.then(op));
	}
	private _thenAsync<U, F>(op: Fn<Result<T, E>, AsyncResult<U, F>>): AsyncResult<U, F> {
		return new AsyncResult(resolve => this.start((result: Result<T, E>) => op(result).start(resolve)));
	}
}

export type AsyncResultOk<T> = AsyncResult<T, any, true>;
export type AsyncResultErr<E> = AsyncResult<any, E, true>;

export const AsyncOk = AsyncResult.ok;
export const AsyncErr = AsyncResult.err;
