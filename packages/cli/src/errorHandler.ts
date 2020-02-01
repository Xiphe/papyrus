import { Logger } from '@papyrus/common';

export default function errorHandler(
  { red }: Pick<Logger['color'], 'red'> = { red: (s: string) => s },
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
