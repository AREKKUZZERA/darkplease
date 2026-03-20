// @ts-check
import {getDestDir, absolutePath} from './paths.js';
import {PLATFORM} from './platform.js';
import * as reload from './reload.js';
import {createTask} from './task.js';
import {readJSON, writeJSON} from './utils.js';

/** @typedef {import('./types').Manifest} Manifest */
/** @typedef {import('./types').PlatformId} PlatformId */
/** @typedef {import('./types').BuildPlatforms} BuildPlatforms */
/** @typedef {import('./types').TaskOptions} TaskOptions */

/**
 * @param {PlatformId} platform
 * @param {boolean} debug
 * @param {boolean} watch
 * @param {boolean} test
 * @returns {Promise<Manifest>}
 */
async function patchManifest(platform, debug, watch, test) {
    const manifest = /** @type {Manifest} */ (await readJSON(absolutePath('src/manifest.json')));
    const manifestPatch = platform === PLATFORM.CHROMIUM_MV2 || platform === PLATFORM.CHROMIUM_MV2_PLUS ? {} :
        /** @type {Manifest} */ (await readJSON(absolutePath(`src/manifest-${platform.replace('-plus', '')}.json`)));
    const manifestExtras = platform === PLATFORM.CHROMIUM_MV2_PLUS ?
        /** @type {Manifest} */ (await readJSON(absolutePath('src/plus/manifest.json'))) : {};
    const patched = /** @type {Manifest} */ ({...manifest, ...manifestPatch, ...manifestExtras});
    if (!patched.permissions) {
        patched.permissions = [];
    }
    if (debug && platform === PLATFORM.CHROMIUM_MV3) {
        patched.name = 'DARK PLEASE! MV3';
    }
    if (platform === PLATFORM.CHROMIUM_MV3) {
        patched.browser_action = undefined;
    }
    if (debug) {
        patched.version = '1';
        patched.description = `Debug build, platform: ${platform}, watch: ${watch ? 'yes' : 'no'}.`;
    }
    if (debug && !test && platform === PLATFORM.CHROMIUM_MV3) {
        patched.permissions.push('tabs');
    }
    if (debug && (platform === PLATFORM.CHROMIUM_MV2 || platform === PLATFORM.CHROMIUM_MV3)) {
        patched.version_name = 'Debug';
    }
    if (debug && platform === PLATFORM.CHROMIUM_MV2_PLUS) {
        patched.version_name = 'Debug Plus';
    }
    // Needed to test settings export and CSS theme export via a download
    if (test || debug) {
        patched.permissions.push('downloads');
    }
    return patched;
}

/** @param {TaskOptions} options */
async function manifests({platforms, debug, watch, test}) {
    const enabledPlatforms = Object.values(PLATFORM).filter((platform) => platform !== PLATFORM.API && platforms[platform]);
    for (const platform of enabledPlatforms) {
        const manifest = await patchManifest(platform, debug, watch, test);
        const destDir = getDestDir({debug, platform});
        await writeJSON(`${destDir}/manifest.json`, manifest);
    }
}

const bundleManifestTask = createTask(
    'bundle-manifest',
    manifests,
).addWatcher(
    ['src/manifest*.json'],
    async (changedFiles, _, buildPlatforms) => {
        const buildPlatformsTyped = /** @type {BuildPlatforms} */ (buildPlatforms);
        const chrome = changedFiles.some((file) => file.endsWith('manifest.json'));
        /** @type {BuildPlatforms} */
        const platforms = {
            [PLATFORM.API]: false,
            [PLATFORM.CHROMIUM_MV2]: false,
            [PLATFORM.CHROMIUM_MV2_PLUS]: false,
            [PLATFORM.CHROMIUM_MV3]: false,
            [PLATFORM.FIREFOX_MV2]: false,
            [PLATFORM.THUNDERBIRD]: false,
        };
        for (const platform of /** @type {PlatformId[]} */ (Object.values(PLATFORM))) {
            const changed = chrome || changedFiles.some((file) => file.endsWith(`manifest-${platform.replace('-plus', '')}.json`));
            platforms[platform] = changed && Boolean(buildPlatformsTyped[platform]);
        }
        await manifests({platforms, debug: true, watch: true, test: false, version: false, log: false});
        reload.reload({type: reload.FULL});
    },
);

export default bundleManifestTask;
