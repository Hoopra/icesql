import { formatBuffer, stringifyBufferValues } from '@src/util/buffer';

describe('formatBuffer', () => {
  it(`should return same value if it's not a buffer`, () => {
    expect(formatBuffer('1')).toBe('1');
  });

  it(`should return buffer string value using default (binary) encoding`, () => {
    expect(formatBuffer(Buffer.from('1'))).toBe('1');
    expect(formatBuffer(Buffer.from('0'))).toBe('0');
    expect(formatBuffer(Buffer.from('101', 'binary'))).toBe('101');
  });

  it(`should return buffer string value using input encoding`, () => {
    expect(formatBuffer(Buffer.from('101', 'base64'), { encoding: 'base64' })).toBe('100=');
  });
});

describe('stringifyBufferValues', () => {
  it(`should format buffer values in object roots`, () => {
    expect(stringifyBufferValues([], {})).toEqual([]);
    expect(
      stringifyBufferValues([{ hello: Buffer.from('you', 'ascii'), me: 'too' }], { specific: { hello: 'ascii' } })
    ).toEqual([{ hello: 'you', me: 'too' }]);
  });
});
