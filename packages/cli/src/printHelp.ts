import { Logger } from './createLogger';

export default function printHelp(log: Logger, version: string) {
  const { yellow, blue, bold } = log.color;
  log(`
${yellow('papyrus')} ${blue('[options]')}

${bold('Options:')}
  ${blue('-s, --silent')}    silence all outputs.
  ${blue('-h, --help')}      print help message.
  ${blue('-v, --version')}   display version (${version})

${bold('Environment:')}
  ${blue('DEBUG=papyrus:*')} display debug messages
`);
}
