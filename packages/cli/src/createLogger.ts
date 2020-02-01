import { Instance, Chalk } from 'chalk';

export type Logger = typeof console.log & {
  color: Chalk;
};

export default function createLogger(): Logger {
  const log = (...args: any[]) => console.log(...args);
  log.color = new Instance();

  return log;
}
