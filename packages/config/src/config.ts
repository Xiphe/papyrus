import { Sys, CreateDebugger } from '@papyrus/common';
import merge from 'lodash.mergewith';
import camelCase from 'lodash.camelcase';
import { Any, TypeOf } from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';

import cosmic from './cosmic';
import placeholdify from './placeholdify';

type Settings<T extends Any> = {
  key: string;
  rootDir: string;
  sys: Sys;
  type: T;
  createDebugger?: CreateDebugger;
};

const noopDebugger = () => () => {};

function withArrays(objValue: any, srcValue: any) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
  return undefined;
}

export default function config<S extends Any>({
  createDebugger = noopDebugger,
  sys: { proc, argv },
  rootDir: initialRootDir,
  key,
  type,
}: Settings<S>): (
  defaults: Partial<TypeOf<S>>,
  mergeStrategy?: (objValue: any, srcValue: any) => any,
) => Promise<TypeOf<S> & { rootDir: string }> {
  const debug = createDebugger('config');
  debug(`gathering config for ${key}`);

  const cosmicP = cosmic(key, initialRootDir);

  const envConfig = Object.entries(proc.env)
    .filter(([key]) => key.match(new RegExp(`^${key}_`, 'i')))
    .map(([key, value]): [string[], unknown] => [
      key
        .replace(new RegExp(`^${key}_`, 'i'), '')
        .split('__')
        .map(camelCase),
      value,
    ])
    .reduce((mem, [[key, ...nested], v]) => {
      let value = v;
      while (nested[0]) {
        value = { [nested.splice(0, 1)[0]]: value };
      }
      return { ...mem, [key]: value };
    }, {} as any);

  const argvConfig = argv
    ? Object.entries(argv)
        .filter(([key]) => key !== '_')
        .map(([key, value]): [string[], unknown] => [
          key.split('--').map(camelCase),
          value,
        ])
        .reduce((mem, [[key, ...nested], v]) => {
          let value = v;
          while (nested[0]) {
            value = { [nested.splice(0, 1)[0]]: value };
          }
          return { ...mem, [key]: value };
        }, {} as any)
    : null;

  return async (defaults, mergeStrategy = withArrays) => {
    const [cosmicConfig, rootDir = initialRootDir] = await cosmicP;

    const mergedConfig = merge(
      {},
      defaults,
      { rootDir },
      cosmicConfig,
      envConfig,
      argvConfig,
      mergeStrategy,
    );

    const finalConfig = placeholdify(mergedConfig);
    debug(`Final config:`, finalConfig);

    const c = type.decode(finalConfig);

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
  };
}
