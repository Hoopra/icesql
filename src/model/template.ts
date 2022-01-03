export type Primitive = string | number | boolean | null;
export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = Array<JSONValue>;
export type JSONValue = Primitive | JSONObject | JSONArray;

// export type QueryArg = Primitive | Date | Buffer | ArrayBuffer | JSONValue | QueryArg[];

export interface SQLTemplate {
  sql: string;
  values: QueryArg[];
}

export type JSONPrimitive = string | number | boolean | null;
// export type JSONObject = { [member: string]: JSONValue };
// export type JSONArray = Array<JSONValue>;
// export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type QueryArg = JSONPrimitive | Date | Buffer | ArrayBuffer | JSONValue | QueryArg[] | undefined;

export type Query = [string] | [string, QueryArg[]];

export type QueryObject = { sql: string; values: QueryArg[] };
