import { BufferOptions } from '@src/model/connection';

export const formatBuffer = (value: any, options: BufferOptions = {}, inputKey?: string) => {
  if (!Buffer.isBuffer(value)) {
    return value;
  }

  const { encoding = 'binary', specific = {} } = options;
  const key = inputKey ?? Object.keys(specific)[0];

  return key ? value.toString(specific[key] || encoding) : value.toString(encoding);
};

export const stringifyBufferValue = <T>(entity: T, options: BufferOptions = {}) =>
  Object.entries(entity || {}).reduce((acc, [key, value]) => {
    const formatted = formatBuffer(value, options, key);
    return { ...acc, [key]: formatted };
  }, {} as T);

export const stringifyBufferValues = <T>(entities: T[], options: BufferOptions = {}) =>
  entities.map(entity => stringifyBufferValue(entity, options));
