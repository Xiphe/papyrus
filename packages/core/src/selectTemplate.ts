import { QuestionCollection } from 'inquirer';

type Template = { name: string; path: string };
export type Prompt = <T>(questions: QuestionCollection<T>) => Promise<T>;

type Config = {
  templates: Template[];
  prompt: Prompt;
};

export default async function selectTemplate({
  templates,
  prompt,
}: Config): Promise<Template> {
  const { templatePath } = await prompt([
    {
      type: 'list',
      message: 'Please choose a papyrus template',
      name: 'templatePath',
      choices: templates.map(({ name, path }) => ({ name, value: path })),
    },
  ]);

  const template = templates.find(({ path }) => path === templatePath);
  if (!template) {
    throw new Error('This should never happen');
  }

  return template;
}
