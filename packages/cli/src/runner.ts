import { Sys } from '@papyrus/common';
import minimist from 'minimist';
import path from 'path';
import merge from 'lodash.merge';
import fs from 'fs';

import { proc as getProcConfig, cosmic as getCosmicConfig } from './config';
import createDebugger from './createDebugger';
import createLogger from './createLogger';
import getArgv from './getArgv';
import printHelp from './printHelp';
import errorHandler from './errorHandler';
import prompt from './prompt';

type RunnerConfig = {
  version: string;
  name: string;
};

export default async function runner({ version, name }: RunnerConfig) {
  let log;
  let debug;
  try {
    debug = createDebugger('cli');
    debug('initializing');
    log = createLogger();
    const argv = getArgv();

    if (argv.version) {
      log(version);
      return;
    }

    if (argv.help) {
      printHelp(log, version);
      return;
    }

    if (!argv.silent) {
      log(`📜 ${log.color.bold(`${name} v${version}`)}`);
    }

    const sys: Sys = {
      path,
      fs,
      proc: process,
      argv: minimist(process.argv.slice(2)),
    };

    const procConfig = getProcConfig(sys);

    const { default: getTemplate } = await import('@papyrus/get-template');

    const template = await getTemplate({
      sys,
      createDebugger,
      prompt,
      config: merge(
        {},
        procConfig,
        await getCosmicConfig('papyrus', sys.proc.cwd()),
      ),
    });

    const { default: papyrus } = await import('@papyrus/core');

    await papyrus({
      sys,
      createDebugger,
      log,
      prompt,
      config: merge(
        {},
        procConfig,
        await getCosmicConfig('papyrus', template.path),
      ),
    });
  } catch (err) {
    errorHandler(log ? log.color : undefined, debug)(err);
  }
}
