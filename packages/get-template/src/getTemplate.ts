import { Sys } from '@papyrus/common';
import config from '@papyrus/config';
import fg from 'fast-glob';
import * as t from 'io-ts';

import selectTemplate, { Prompt } from './selectTemplate';

type Settings = {
  sys: Sys;
  prompt: Prompt;
  config: unknown;
  createDebugger?: (context: string) => (...log: any[]) => void;
};
type Template = { name: string; path: string };

const handleUserConfig = config(
  t.intersection([
    t.type({
      rootDir: t.string,
      templateDir: t.string,
      templateGlob: t.string,
    }),
    t.partial({
      templateName: t.string,
    }),
  ]),
  {
    templateDir: '<rootDir>/templates',
    templateGlob: '*/package.json',
  },
);

const noopDebugger = () => () => {};
function isObject(thing: any): thing is { [key: string]: unknown } {
  return thing && typeof thing === 'object';
}

export default async function getTemplate({
  createDebugger = noopDebugger,
  sys: {
    fs,
    path: { join, relative, dirname },
    proc: { cwd },
  },
  prompt,
  config: userConfig,
}: Settings): Promise<Template> {
  const debug = createDebugger('get-templates');
  debug('initializing');
  const c = handleUserConfig(userConfig);
  debug('Config: %O', c);

  const { rootDir, templateDir, templateGlob, templateName } = c;

  if (templateName) {
    debug(
      `Found Template "${templateName}" in ${relative(cwd(), rootDir) || '.'}`,
    );
    return { name: templateName, path: rootDir };
  }

  debug('looking up templates');

  const templateFiles = await fg(templateGlob, {
    fs,
    absolute: true,
    cwd: templateDir,
  });

  if (!templateFiles.length) {
    throw new Error(
      `No Papyrus templates found in ${relative(
        cwd(),
        join(templateDir, templateGlob),
      ) || '.'}`,
    );
  }

  const templates = await Promise.all(
    templateFiles.map(async (file) => {
      const c = (await import(file)) as unknown;

      if (!isObject(c)) {
        throw new Error(
          `${relative(cwd(), file) || '.'} is not a valid template`,
        );
      }

      const packageConfig = c.papyrus;
      const name =
        (isObject(packageConfig) && packageConfig.templateName) || c.name;

      if (typeof name !== 'string') {
        debug(
          `Ignoring template in ${relative(cwd(), file) ||
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

  const template = Array.isArray(templates)
    ? await selectTemplate({ templates: filteredTemplates, prompt })
    : templates;
  debug('Selected template: %O', template);

  return template;
}
