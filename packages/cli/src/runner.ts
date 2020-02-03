import { Sys } from '@papyrus/common';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs';

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

    const { default: config } = await import('@papyrus/config');
    const { default: getTemplates, Config } = await import(
      '@papyrus/get-template'
    );

    const template = await getTemplates({
      sys,
      createDebugger,
      configKey: 'papyrus',
      prompt,
      config: config({
        key: 'papyrus',
        type: Config,
        rootDir: sys.proc.cwd(),
        sys,
        createDebugger,
      }),
    });

    console.log(template);
  } catch (err) {
    errorHandler(log ? log.color : undefined, debug)(err);
  }
}
