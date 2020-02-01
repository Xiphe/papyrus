import { Sys, Logger, CreateDebugger } from '@papyrus/common';
export type Config = {
  sys: Sys;
  log: Logger;
  createDebugger: CreateDebugger;
};

export default async function papyrus({
  sys: { argv = {}, path, fs, proc },
  log,
  createDebugger,
}: Config) {
  const { default: getTemplates } = await import('@papyrus/get-templates');
  const sys = { argv, path, fs, proc };

  const templates = await getTemplates({
    createDebugger,
    sys,
    configKey: 'papyrus',
  });
  console.log('TEMPLATES', templates);
}
