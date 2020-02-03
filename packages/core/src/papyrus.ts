import { Sys, Logger, CreateDebugger, Prompt } from '@papyrus/common';

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
}
