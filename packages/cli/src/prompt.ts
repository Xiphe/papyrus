import { PromptModule, QuestionCollection } from 'inquirer';

let cache: Promise<PromptModule> | null = null;

export default async function prompt<T>(
  questions: QuestionCollection<T>,
): Promise<T> {
  if (!cache) {
    cache = new Promise(async (resolve, reject) => {
      try {
        const autocompleteP = import('inquirer-autocomplete-prompt');
        const prompt = (await import('inquirer')).createPromptModule();

        prompt.registerPrompt('autocomplete', await autocompleteP);

        resolve(prompt);
      } catch (err) {
        reject(err);
      }
    });
  }

  return (await cache)(questions);
}
