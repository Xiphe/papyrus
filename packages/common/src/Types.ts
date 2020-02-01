import fs from 'fs';
import path from 'path';

export type Sys = {
  argv?: { [key: string]: string | undefined };
  path: {
    join: typeof path.join;
    relative: typeof path.relative;
    dirname: typeof path.dirname;
  };
  fs: {
    lstat: typeof fs.lstat;
    stat: typeof fs.stat;
    lstatSync: typeof fs.lstatSync;
    statSync: typeof fs.statSync;
    readdir: typeof fs.readdir;
    readdirSync: typeof fs.readdirSync;
  };
  proc: {
    cwd: typeof process.cwd;
    env: typeof process.env;
  };
};

type colorize = (s: string) => string;
export type Logger = ((...args: any[]) => void) & {
  color: {
    yellow: colorize;
    blue: colorize;
    red: colorize;
    bold: colorize;
  };
};

export type CreateDebugger = (context: string) => (...log: any[]) => void;
