export type None = undefined;
export type Option<T> = T | None;

export const none: None = void 0;
export const isSome = <T>(option: Option<T>): option is T =>
	typeof option !== "undefined";
export const isNone = <T>(option: Option<T>): option is None =>
	typeof option === "undefined";

export const fromNullable = <T>(nullable: T | null): Option<T> =>
	nullable !== null ? nullable : none;
