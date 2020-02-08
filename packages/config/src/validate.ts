import { Any, TypeOf } from 'io-ts';

import { isLeft } from 'fp-ts/lib/Either';

export default function validate<T extends Any>(
  type: T,
  config: unknown,
): TypeOf<T> {
  const c = type.decode(config);

  if (isLeft(c)) {
    const errors = c.left.map(({ context }) => {
      const path = context
        .reduce(
          ([mem, parentProps], { key, type }): [string[], any] => {
            const props = (type as any).props || null;

            if (parentProps && parentProps[key]) {
              return [mem.concat(key), props];
            }

            return [mem, props];
          },
          [[], null] as [string[], any],
        )[0]
        .join('.');

      const {
        actual,
        type: { name },
      } = context[context.length - 1];
      return `Invalid configuration value ${
        actual instanceof Function ? actual : JSON.stringify(actual)
      } supplied to ${path} expected type ${name}`;
    });
    throw new Error(errors.join('\n'));
  }

  return c.right;
}
