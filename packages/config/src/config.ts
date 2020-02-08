import { Any, TypeOf } from 'io-ts';
import merge from 'lodash.merge';

import validate from './validate';
import placeholdify from './placeholdify';

export default function config<S extends Any>(
  type: S,
  defaults: Partial<TypeOf<S>> = {},
  ignorePlaceHolders?: string[],
): (userConfig: unknown) => TypeOf<S> {
  return (userConfig) => {
    const finalConfig = placeholdify(
      merge({}, defaults, userConfig),
      ignorePlaceHolders,
    );

    return validate(type, finalConfig);
  };
}
