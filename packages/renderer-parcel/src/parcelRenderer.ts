import { ModuleConfig } from '@papyrus/common';
import config from '@papyrus/config';
import { VIRTUAL_DIR } from '@papyrus/parcel-resolver-virtual';
import Parcel, { createWorkerFarm } from '@parcel/core';
import defaultConfig from '@parcel/config-default';
import { NodeFS, OverlayFS, MemoryFS } from '@parcel/fs';
import { NodePackageManager } from '@parcel/package-manager';
import getPort from 'get-port';
import * as t from 'io-ts';

const handleUserInput = config(t.type({ index: t.string, rootDir: t.string }), {
  index: '<rootDir>/index.html',
});

export default async function parcelRenderer({
  createDebugger,
  log,
  sys: {
    path: { join },
  },
  config: userConfig,
}: ModuleConfig) {
  const debug = createDebugger('renderer-parcel');
  debug('initialising');
  const c = handleUserInput(userConfig);
  debug('Config %O', c);
  const { index, rootDir } = c;
  const portP = getPort({ port: 1337 });
  const workerFarm = createWorkerFarm();
  const nodeFs = new NodeFS();
  const memoryFs = new MemoryFS(workerFarm);
  const overlayFS = new OverlayFS(memoryFs, nodeFs);

  debug('preparing virtual papyrus files');
  const virtualDir = join(rootDir, VIRTUAL_DIR);
  const entryFile = join(virtualDir, 'entry.js');
  await memoryFs.mkdirp(virtualDir);
  await memoryFs.writeFile(entryFile, 'console.log("DANG")');

  const parcelConfig = {
    workerFarm,
    inputFS: overlayFS,
    outputFS: overlayFS,
    entries: index,
    packageManager: new NodePackageManager(overlayFS),
    config: {
      ...defaultConfig,
      reporters: ['@parcel/reporter-dev-server'],
      resolvers: ['@papyrus/parcel-resolver-virtual'].concat(
        defaultConfig.resolvers,
      ),
      filePath: require.resolve('@parcel/config-default'),
    },
    patchConsole: false,
    hot: true,
    serve: {
      https: false,
      port: await portP,
    },
  };

  debug('staring parcel with config: %O', parcelConfig);
  const { unsubscribe } = await new Parcel(parcelConfig).watch();

  log(`${log.color.blue('Preview:')} http://localhost:${await portP}`);

  setTimeout(() => {
    memoryFs.writeFile(entryFile, 'alert("BOOM")');
  }, 10000);

  debug('parcel is running');
  return () => unsubscribe();
}
