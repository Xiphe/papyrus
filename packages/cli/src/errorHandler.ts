import chalk, { Chalk } from 'chalk';

export default function errorHandler(
  { red }: Chalk = chalk,
  debug?: (...args: any[]) => void,
) {
  return (err: any) => {
    console.error(red(err));
    if (debug) {
      debug(err.stack);
    }
    process.exit(err.code || 1);
  };
}
