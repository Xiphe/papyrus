import { Sys } from '@papyrus/common';
import camelCase from 'lodash.camelcase';
import merge from 'lodash.merge';

export default function getProcConfig({
  proc: { env },
  argv,
}: Pick<Sys, 'argv' | 'proc'>) {
  const envConfig = Object.entries(env)
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

  return merge({}, envConfig, argvConfig);
}
