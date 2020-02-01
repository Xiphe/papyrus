import minimist from 'minimist';

export default function getArgv() {
  return minimist(process.argv.slice(2), {
    alias: {
      s: 'silent',
      h: 'help',
      v: 'version',
    },
    boolean: ['silent', 'help', 'version'],
  });
}
