import {
  Sys,
  Logger,
  CreateDebugger,
  Prompt,
  ModuleConfig,
} from '@papyrus/common';
import config from '@papyrus/config';
import * as t from 'io-ts';
import { moduleInterop } from '@textlint/module-interop';

type Config = {
  sys: Sys;
  log: Logger;
  prompt: Prompt;
  createDebugger: CreateDebugger;
  config: unknown;
};

const handleUserConfig = config(
  t.intersection([
    t.type({
      rootDir: t.string,
      templateName: t.string,
      renderer: t.union([
        t.string,
        t.Function,
        t.tuple([t.union([t.string, t.Function]), t.object]),
      ]),
    }),
    t.partial({}),
  ]),
  {
    renderer: '@papyrus/renderer-parcel',
  },
  ['renderer'],
);

async function loadRenderer(moduleName: string): Promise<Function> {
  let renderer: unknown = moduleInterop(await import(moduleName));

  if (typeof renderer !== 'function') {
    throw new Error(`renderer ${moduleName} does not resolve to a function`);
  }

  return renderer;
}

async function normalizeRendererInput(
  renderer: string | Function | [string | Function, object],
): Promise<[Function, {}]> {
  const [r, userConfig] = Array.isArray(renderer) ? renderer : [renderer, {}];

  return [typeof r === 'string' ? await loadRenderer(r) : r, userConfig];
}

export default async function papyrus({
  sys,
  log,
  prompt,
  config: userConfig,
  createDebugger,
}: Config) {
  const debug = createDebugger('core');
  debug('initializing');
  const c = handleUserConfig(userConfig);
  debug('Config: %O', c);
  const { rootDir, renderer: rendererInput } = c;

  debug('loading renderer: %O', rendererInput);
  const [renderer, userRendererConfig] = await normalizeRendererInput(
    rendererInput,
  );

  const rendererConfig: ModuleConfig = {
    sys,
    createDebugger,
    log,
    config: {
      rootDir,
      ...userRendererConfig,
    },
  };

  await renderer(rendererConfig);
}
