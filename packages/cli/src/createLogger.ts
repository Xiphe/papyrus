import { Instance } from 'chalk';
import { Logger } from '@papyrus/common';

export default function createLogger(): Logger {
  const log = (...args: any[]) => console.log(...args);
  log.color = new Instance();

  return log;
}
