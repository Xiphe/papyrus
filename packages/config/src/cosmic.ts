import { cosmiconfig } from 'cosmiconfig';
import { dirname } from 'path';
import TypeScriptLoader from '@endemolshinegroup/cosmiconfig-typescript-loader';

export default async function getConfigFromCosmicAndEnv(
  configKey: string,
  cwd: string,
): Promise<[unknown, string | undefined]> {
  const { config: rawConfig, filepath } =
    (await cosmiconfig(configKey, {
      loaders: {
        '.ts': TypeScriptLoader,
      },
      packageProp: configKey,
      searchPlaces: [
        'package.json',
        `.${configKey}rc`,
        `.${configKey}rc.json`,
        `.${configKey}rc.yaml`,
        `.${configKey}rc.yml`,
        `.${configKey}rc.js`,
        `.${configKey}rc.ts`,
        `${configKey}.config.js`,
        `${configKey}.config.ts`,
      ],
    }).search(cwd)) || {};

  return [
    typeof rawConfig === 'function' ? await rawConfig() : rawConfig,
    filepath ? dirname(filepath) : filepath,
  ];
}
