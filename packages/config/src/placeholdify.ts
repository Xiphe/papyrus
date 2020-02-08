/* shamelessly copied from untool/core */

import flatten from 'flat';
import escapeRegExp from 'escape-string-regexp';
import isPlainObject from 'lodash.isplainobject';

export default function placeholdify<S>(config: S, ignore: string[] = []): S {
  const flatConfig = flatten(config) as { [key: string]: never };
  const configPaths = Object.keys(flatConfig).map(escapeRegExp);
  const regExp = new RegExp(`<(${configPaths.join('|')})>`, 'g');
  const replaceRecursive = (item: any, parentKeys: string[] = []): any => {
    if (ignore.includes(parentKeys.join('.'))) {
      return item;
    }

    if (Array.isArray(item)) {
      return item.map((subItem, k) =>
        replaceRecursive(subItem, parentKeys.concat(`${k}`)),
      );
    }
    if (isPlainObject(item)) {
      return Object.entries(item).reduce(
        (result, [key, value]) => ({
          ...result,
          [key]: replaceRecursive(value, parentKeys.concat(key)),
        }),
        {},
      );
    }

    if (typeof item === 'string' && regExp.test(item)) {
      return item.replace(regExp, (_: any, key: any) =>
        replaceRecursive(flatConfig[key] || '', parentKeys),
      );
    }

    return item;
  };
  return replaceRecursive(config) as S;
}
