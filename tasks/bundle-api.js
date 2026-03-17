// @ts-check
import fs from 'node:fs';
import os from 'node:os';

import rollupPluginReplace from '@rollup/plugin-replace';
import rollupPluginTypescript from '@rollup/plugin-typescript';
import * as rollup from 'rollup';
import typescript from 'typescript';

import {absolutePath} from './paths.js';
import {createTask} from './task.js';

/** @typedef {import('./types').TaskOptions} TaskOptions */
/** @typedef {Pick<TaskOptions, 'debug' | 'watch'>} APITaskOptions */

/** @typedef {'umd' | 'esm'} APIModuleType */

async function getVersion() {
    const file = await fs.promises.readFile(new URL('../package.json', import.meta.url), 'utf8');
    const p = /** @type {{version: string}} */ (JSON.parse(file));
    return p.version;
}

/** @type {string[]} */
let watchFiles = [];

/**
 * @param {APITaskOptions} options
 * @param {APIModuleType} moduleType
 * @param {string} dest
 */
async function bundleAPIModule({debug, watch}, moduleType, dest) {
    const src = absolutePath('src/api/index.ts');
    const bundle = await rollup.rollup({
        input: src,
        onwarn: (error) => {
            throw error;
        },
        plugins: [
            rollupPluginTypescript({
                rootDir: absolutePath('.'),
                typescript,
                tsconfig: absolutePath('src/api/tsconfig.json'),
                noImplicitAny: debug ? false : true,
                noUnusedLocals: debug ? false : true,
                strictNullChecks: debug ? false : true,
                removeComments: debug ? false : true,
                sourceMap: debug ? true : false,
                inlineSources: debug ? true : false,
                noEmitOnError: watch ? false : true,
                outDir: absolutePath('.'),
                cacheDir: debug ? `${fs.realpathSync(os.tmpdir())}/dark-please_api_typescript_cache` : undefined,
            }),
            rollupPluginReplace({
                preventAssignment: true,
                __DEBUG__: false,
                __CHROMIUM_MV2__: false,
                __CHROMIUM_MV3__: false,
                __FIREFOX_MV2__: false,
                __THUNDERBIRD__: false,
                __TEST__: false,
                __PLUS__: false,
            }),
        ].filter(Boolean),
    });
    watchFiles = bundle.watchFiles;
    await bundle.write({
        banner: `/**\n * DARK PLEASE! v${await getVersion()}\n * https://github.com/AREKKUZZERA/darkplease\n */\n`,
        // TODO: Consider removing next line
        esModule: true,
        file: dest,
        strict: true,
        format: moduleType,
        name: 'DarkPlease',
        sourcemap: debug ? 'inline' : false,
    });
}

/** @param {APITaskOptions} options */
async function bundleAPI({debug, watch}) {
    await bundleAPIModule({debug, watch}, 'umd', 'darkplease.js');
    await bundleAPIModule({debug, watch}, 'esm', 'darkplease.mjs');
}

const bundleAPITask = createTask(
    'bundle-api',
    bundleAPI,
).addWatcher(
    () => {
        return watchFiles;
    },
    async (changedFiles, watcher) => {
        const oldWatchFiles = watchFiles;
        await bundleAPI({debug: true, watch: true});

        watcher.unwatch(
            oldWatchFiles.filter((oldFile) => !watchFiles.includes(oldFile))
        );
        watcher.add(
            watchFiles.filter((newFile) => oldWatchFiles.includes(newFile))
        );
    },
);

export default bundleAPITask;
