import merge from 'lodash.mergewith';
import snakeCase from 'lodash.snakecase';
import kebabCase from 'lodash.kebabcase';

import cosmic from './cosmic';
import placeholdify from './placeholdify';
import { Shape, validate, ToConfig, extract } from './shape';

type Settings<S extends Shape> = {
  configKey: string;
  cwd: string;
  env?: { [key: string]: string | undefined };
  argv?: { [key: string]: string | undefined };
  defaults?: Partial<ToConfig<S>>;
  shape: S;
  createDebugger?: (context: string) => (...log: any[]) => void;
};

const noopDebugger = () => () => {};

function withArrays(objValue: any, srcValue: any) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
  return undefined;
}

export default async function config<S extends Shape>({
  createDebugger = noopDebugger,
  cwd,
  defaults = {},
  env = {},
  argv = {},
  configKey,
  shape,
}: Settings<S>): Promise<[ToConfig<S>, string]> {
  const debug = createDebugger('config');
  debug(`gathering config for ${configKey}`);

  const [cosmicConfig, filePath] = await cosmic(configKey, cwd);
  debug(`got cosmic-config at ${filePath}:`, cosmicConfig);

  const envConfig = env
    ? extract(
        shape,
        (keys) =>
          env[`${configKey}_${keys.map(snakeCase).join('__')}`.toUpperCase()],
      )
    : {};
  if (env) {
    debug(`got env-config config:`, envConfig);
  }

  const argvConfig = argv
    ? extract(
        shape,
        (keys) => argv[`${keys.map(kebabCase).join('--')}`.toLowerCase()],
      )
    : {};
  if (env) {
    debug(`got argv-config config:`, argvConfig);
  }

  const mergedConfig = merge(
    {},
    defaults,
    cosmicConfig,
    envConfig,
    argvConfig,
    withArrays,
  );
  debug(`Merged config:`, mergedConfig);

  const finalConfig = placeholdify(mergedConfig);
  debug(`Final config:`, finalConfig);

  if (validate(finalConfig, shape)) {
    debug('Config is valid!');
    return [finalConfig, filePath || cwd];
  }

  throw new Error();
}
