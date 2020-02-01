import minimist from 'minimist';
import path from 'path';
import fs from 'fs';

import createDebugger from './createDebugger';
import createLogger from './createLogger';
import getArgv from './getArgv';
import printHelp from './printHelp';
import errorHandler from './errorHandler';

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

    const { default: papyrus } = await import('@papyrus/core');
    await papyrus({
      sys: {
        path,
        fs,
        proc: process,
        argv: minimist(process.argv.slice(2)),
      },
      createDebugger,
      log,
    });

    // const context: Context = {
    //   log,
    //   createDebugger,
    // };

    // const config = await (await import('@papyrus/config')).default({
    //   createDebugger,
    //   configKey: NAMESPACE,
    //   keys: ['tamplateDir'],
    // });
  } catch (err) {
    errorHandler(log ? log.color : undefined, debug)(err);
  }
}
