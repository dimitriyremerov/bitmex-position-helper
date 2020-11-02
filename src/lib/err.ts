export type AppErr<M extends string> = {
	module: M,
	code: number,
	data?: any,
	prev?: AnyErr,
};
export type AnyErr = AppErr<any>;

export const errModule =
	<M extends string>(module: M) =>
		(code: number, data?: any, prev?: AnyErr): AppErr<M> =>
			({ module, code, data, prev });

export const encloseErrModule =
	<M extends string>(module: M) =>
		(code: number, data?: any, prev?: AnyErr): AppErr<M> =>
			({ module, code, data, prev });
		
export const panic = (msg: string, extra?: any): never => {
	msg = "Panic: " + msg;
	throw { msg, extra };
};
