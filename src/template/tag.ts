import zip from 'lodash.zip';

import { QueryObject, QueryArg } from '@src/model/template';
import { createListOfSqlParams } from '@src/util/format';

const argumentToParameters = (arg: any): string => {
  if (arg === undefined) {
    return '';
  }

  if (Array.isArray(arg)) {
    return `${createListOfSqlParams(arg.length)}`;
  }

  return '?';
};

export class SQLStatement implements QueryObject {
  private statement: string = '';
  private arguments: QueryArg[] = [];

  constructor(strings: string[], args: QueryArg[]) {
    this.arguments = (args ?? [])
      .reduce((acc: QueryArg[], arg) => [...acc, ...(arg instanceof SQLStatement ? arg.values : [arg])], []) // extract and include args from QueryObjects
      .flat();

    if (this.arguments.some(arg => arg === undefined)) {
      throw Error('MySQL arguments cannot contain undefined');
    }

    const combined = zip(strings, args);
    this.statement = combined.reduce(
      (statement: string, [s, a]: any) =>
        `${statement}${s}${a instanceof SQLStatement ? a.statement : argumentToParameters(a)}`,
      ''
    );
  }

  public get sql() {
    return this.statement;
  }

  public get values() {
    return this.arguments;
  }

  public set values(value: any) {
    this.arguments = value;
  }
}

export const SQL = (template: TemplateStringsArray, ...args: any[]): SQLStatement =>
  new SQLStatement(Array.from(template), args);
