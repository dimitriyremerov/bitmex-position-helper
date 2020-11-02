export type Fn<T, U> = (arg: T) => U;
export type IsFn<T, U extends T> = (arg: T) => arg is U;
