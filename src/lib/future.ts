import { isSome, Option, none } from "./option";
import { Fn } from "./fn";

export class Future<T> {
	protected resolved: Resolved<T> = {
		resolved: false,
	};
	protected resolvers: Resolver<T>[] = [
		(result: T) => {
			if (this.resolved.resolved) {
				return;
			} 
			this.resolved = {
				resolved: true,
				value: result,
			};
			this.abort();
		},
	];
	protected immediate: Option<NodeJS.Immediate>;

	public constructor(protected readonly executor: Executor<T>) {
	}

	static fromPromise<T>(promise: Promise<T>): Future<T> {
		return new Future(resolve => promise.then(resolve));
	}
	static resolve<T>(val: T): Future<T> {
		return new Future(resolve => resolve(val));
	}

	static all<T>(futures: Future<T>[]): Future<T[]> {
		if (futures.length === 0) {
			return Future.resolve<T[]>([]);
		}
		return new Future(resolve => {
			const results: T[] = [];
			let done = 0;
			const saveRes = (i: number) =>
				(result: T) => {
					results[i] = result;
					if (++done === futures.length) {
						resolve(results);
					}
				};
			for (let i = 0; i < futures.length; i++) {
				futures[i].start(saveRes(i));
			}
		});
	}

	start(resolver?: Resolver<T>): this {
		if (isSome(resolver)) {
			this.pushResolver(resolver);
		}
		if (this.resolvers.length > 0) {
			this.immediate = setImmediate(() => this.executor(this.resolve.bind(this)));
		}
		return this;
	}
	abort(): this {
		if (isSome(this.immediate)) {
			clearImmediate(this.immediate);
			this.immediate = none;
		}
		return this;
	}

	poll(): Resolved<T> {
		return this.resolved;
	}

	/**
	 * Important! Calling this method does not start the Future execution.
	 * You must call Future.start() either prior to (recommended) or after getting the promise.
	 */
	promise(): Promise<T> {
		return new Promise(resolve => this.pushResolver(resolve));
	}

	pushResolver(resolver: Resolver<T>): this {
		this.resolvers.push(resolver);
		if (this.resolved.resolved) {
			this.resolve(this.resolved.value);
		}
		return this;
	}

	/**
	 * This will start the timeout immediatelly upon calling, not when the execution starts,
	 * so it's probably better to call this together with Future.start()
	 */
	setTimeout(ms: number, def: T): this {
		const timeout = setTimeout(() => this.resolve(def), ms);
		this.pushResolver(() => clearTimeout(timeout));
		return this;
	}

	protected resolve(result: T): void {
		while (this.resolvers.length > 0) {
			const resolver = this.resolvers.shift();
			if (isSome(resolver)) {
				resolver(result);
			}
		}
	}

	then<U>(op: Fn<T, U>): Future<U> {
		return new Future(resolve =>
			this.start((result: T) => resolve(op(result)))
		);
	}

	thenAsync<U>(op: Fn<T, Future<U>>): Future<U> {
		return new Future(resolve =>
			this.start((result: T) => op(result).start(resolve))
		);
	}
}

export const fut = Future.resolve;

export const sleep = <T>(ms: number, value: T): Future<T> =>
	new Future(resolve => setTimeout(() => resolve(value), ms));

export type Resolver<T> = (result: T) => any;
export type Executor<T> = (resolve: Resolver<T>) => any;
type Resolved<T> = {
	resolved: false,
} | {
	resolved: true,
	value: T,
};
