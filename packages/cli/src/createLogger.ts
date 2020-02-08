import { Logger } from '@papyrus/common';
import { Instance } from 'chalk';

export default function createLogger(): Logger {
  const log = (...args: any[]) => console.log(...args);
  log.color = new Instance();

  return log;
}
