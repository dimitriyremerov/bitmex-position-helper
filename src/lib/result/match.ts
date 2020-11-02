import { Fn } from "../fn";
import { Result, Err, Ok } from "../result";

export const match = <T extends MatchType, U, E>(matchMap: MatchMap<T, U>, def: E) =>
	(val: MatchType): Result<U, E> => 
		val in matchMap ? Ok(matchMap[val as T]!()) : Err(def);

type MatchMap<T extends MatchType, U> = {
	[k in T]?: Fn<void, U>;
};
type MatchType = string | number;
