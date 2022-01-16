import { QueryObject } from '@src/model/template';
import { createListOfSqlParams } from '@src/util/format';
import { QueryOperator, Queryable, QueryOptions } from '@src/model/template';
import { where } from './where';

export const find = <T extends Queryable>(
  QueryOperator: QueryOperator<T> = {},
  tableName: string,
  options: QueryOptions<T> = {}
): QueryObject => {
  const { $projection } = options;
  const select = `SELECT ${$projection ? $projection.join(', ') : '*'} FROM ${tableName}`;
  const parsed = parseOptions(QueryOperator, options);

  return { sql: `${select} ${parsed.sql}`.trim(), values: parsed.values };
};

export const remove = <T extends Queryable>(
  QueryOperator: QueryOperator<T> = {},
  tableName: string,
  options: QueryOptions<T> = {}
): QueryObject => {
  const parsed = parseOptions(QueryOperator, options);

  return { sql: `DELETE FROM ${tableName} ${parsed.sql}`.trim(), values: parsed.values };
};

export const update = <T extends Queryable>(
  QueryOperator: QueryOperator<T>,
  tableName: string,
  update: Partial<T>
): QueryObject => {
  const statement = `UPDATE ${tableName}`;
  const entries = Object.entries(update).filter(([key, value]) => key !== 'id' && value !== undefined);
  const set = `${entries.map(([key]) => `${key} = ?`).join(', ')}`;
  const values = entries.map(([, value]) => formatParameter(value));
  const parsed = parseOptions(QueryOperator);

  return {
    sql: `${statement} SET ${set} ${parsed.sql}`.trim(),
    values: [...values, ...(parsed.values ?? [])],
  };
};

export const insert = <T extends { [key: string]: any }>(entries: T | T[], tableName: string): QueryObject => {
  if (!Array.isArray(entries)) {
    return insert([entries], tableName);
  }

  const entryKeys = findKeys(entries);
  const keys = `(${entryKeys.join(',')})`;

  const values = entries.reduce(
    (acc, entry) =>
      acc.concat(
        entryKeys.map(key => {
          const value = entry[key];
          return value !== null && value !== undefined ? formatParameter(value) : null;
        })
      ),
    [] as any[]
  );
  const sqlParams = entries.map(() => `(${createListOfSqlParams(entryKeys.length)})`);

  return {
    sql: `INSERT INTO ${tableName} ${keys} VALUES ${sqlParams.join(',')};`,
    values,
  };
};

const findKeys = <T extends { [key: string]: any }>(entries: T[]): string[] =>
  entries.reduce((allKeys, entry) => Array.from(new Set(allKeys.concat(Object.keys(entry)))), [] as string[]);

const parseOptions = <T extends Queryable>(
  QueryOperator: QueryOperator<T> = {},
  { $limit, $sort }: QueryOptions<T> = {}
) => {
  const whereCondition = where(QueryOperator);
  const ordering = $sort
    ? ` ORDER BY ${Object.entries($sort)
        .map(([key, value]) => `${key} ${value === 1 ? 'ASC' : 'DESC'}`)
        .join(', ')}`
    : '';
  const limiter = $limit ? ` LIMIT ${$limit}` : '';

  return {
    sql: `${whereCondition.sql}${limiter}${ordering}`.trim(),
    values: whereCondition.values,
  };
};

export const formatParameter = (value: unknown): string | number | Date => {
  switch (typeof value) {
    case 'object':
      return value instanceof Date ? value : JSON.stringify(value);
    case 'string':
    case 'number':
    default:
      return value as string | number;
  }
};
