import { Sys, Logger, CreateDebugger } from '@papyrus/common';

import selectTemplate, { Prompt } from './selectTemplate';

export type Config = {
  sys: Sys;
  log: Logger;
  prompt: Prompt;
  createDebugger: CreateDebugger;
};

export default async function papyrus({
  sys: { argv = {}, path, fs, proc },
  log,
  prompt,
  createDebugger,
}: Config) {
  const debug = createDebugger('core');
  debug('initializing');
  const { default: getTemplates } = await import('@papyrus/get-templates');
  const sys = { argv, path, fs, proc };

  const templates = await getTemplates({
    createDebugger,
    sys,
    configKey: 'papyrus',
  });

  const template = Array.isArray(templates)
    ? await selectTemplate({ templates, prompt })
    : templates;
  debug('Selected template:', template);
}
