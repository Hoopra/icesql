import { QueryArg } from '@src/model/template';
import { format } from 'sqlstring';

const SQL_PARAM_CHARACTER: string = '?';

export const createListOfSqlParams = (count: number) =>
  count <= 0 ? '' : [...SQL_PARAM_CHARACTER.repeat(count)].join(',');

export const formatSQL = (sql: string, args: QueryArg[] = []): string =>
  format(sql, args)
    .split('\n')
    .filter(str => !!str)
    .map(str => str.trim())
    .join(' ');
