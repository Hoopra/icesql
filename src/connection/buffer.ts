type Encoding = 'binary' | 'base64' | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'latin1' | 'hex';
export type BufferOptions = {
  encoding?: Encoding;
  specific?: Record<string, Encoding>;
};

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
