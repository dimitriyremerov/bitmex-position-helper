export type JsonValue = JsonPrimitive | JsonStruct;
export type JsonPrimitive = string | number | boolean | null;
export type JsonStruct = JsonArray | JsonObject;
export type JsonArray = JsonValue[];
export type JsonObject = {
	[key: string]: JsonValue | undefined,
};
