import fg, { Options } from 'fast-glob';

type Settings = {
  configKey: string;
  argv?: { [key: string]: string | undefined };
  fs: Options['fs'];
  path: {
    join: (...paths: string[]) => string;
    relative: (from: string, to: string) => string;
    dirname: (p: string) => string;
  };
  proc: {
    cwd: () => string;
    env: { [key: string]: string | undefined };
  };
  createDebugger?: (context: string) => (...log: any[]) => void;
};
type Template = { name: string; path: string };

const noopDebugger = () => () => {};
function isObject(thing: any): thing is { [key: string]: unknown } {
  return thing && typeof thing === 'object';
}

export default async function getTemplates({
  createDebugger = noopDebugger,
  argv,
  fs,
  path: { join, relative, dirname },
  proc,
  configKey,
}: Settings): Promise<Template | Template[]> {
  const debug = createDebugger('get-templates');
  debug('initializing');
  const cwd = proc.cwd();
  const { default: getConfig, optional } = await import('@papyrus/config');
  const [config, projectPath] = await getConfig({
    shape: {
      rootDir: String,
      templateName: optional(String),
      templateDir: String,
      templateGlob: String,
    },
    cwd,
    defaults: {
      rootDir: cwd,
      templateDir: '<rootDir>/templates',
      templateGlob: '*/package.json',
    },
    argv,
    env: proc.env,
    createDebugger,
    configKey,
  });

  if (config.templateName) {
    debug(
      `Found Template "${config.templateName}" in ${relative(
        cwd,
        projectPath,
      ) || '.'}`,
    );
    return { name: config.templateName, path: projectPath };
  }

  debug('looking up templates');

  const templateFiles = await fg(config.templateGlob, {
    fs,
    absolute: true,
    cwd: config.templateDir,
  });

  if (!templateFiles.length) {
    throw new Error(
      `No Papyrus templates found in ${relative(
        cwd,
        join(config.templateDir, config.templateGlob),
      ) || '.'}`,
    );
  }

  const templates = await Promise.all(
    templateFiles.map(async (file) => {
      const c = (await import(file)) as unknown;

      if (!isObject(c)) {
        throw new Error(
          `${relative(cwd, file) || '.'} is not a valid template`,
        );
      }

      const sc = c[configKey];
      const name = (isObject(sc) && sc.templateName) || c.name;

      if (typeof name !== 'string') {
        debug(
          `Ignoring template in ${relative(cwd, file) ||
            '.'} because it has no name`,
        );
        return null;
      }

      return {
        path: dirname(file),
        name,
      };
    }),
  );

  const filteredTemplates = templates.filter(
    (t: Template | null): t is Template => Boolean(t),
  );

  debug(
    `Found ${filteredTemplates.length} template${
      filteredTemplates.length === 1 ? '' : 's'
    }: ${filteredTemplates.map(({ name }) => name).join(', ')}`,
  );

  return filteredTemplates;
}
