import { join } from 'path';
import { Resolver } from '@parcel/plugin';

export const VIRTUAL_DIR = '.parcel-virtual';

export default new Resolver({
  async resolve({ options: { projectRoot }, filePath }: any) {
    if (filePath === '@papyrus/entry') {
      return { filePath: join(projectRoot, VIRTUAL_DIR, 'entry.js') };
    }
    return null;
  },
});
