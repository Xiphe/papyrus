import * as t from 'io-ts';

export const Config = t.intersection([
  t.type({
    rootDir: t.string,
    templateDir: t.string,
    templateGlob: t.string,
  }),
  t.partial({
    templateName: t.string,
  }),
]);

export type ConfigT = t.TypeOf<typeof Config>;
