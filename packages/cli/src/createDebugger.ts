import debug from 'debug';

export default function createDebugger(context: string) {
  return debug(`papyrus:${context}`);
}
