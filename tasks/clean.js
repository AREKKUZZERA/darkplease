// @ts-check
import {getDestDir} from './paths.js';
import {PLATFORM} from './platform.js';
import {createTask} from './task.js';
import {removeFolder} from './utils.js';

/**
 * @param {import('./types').TaskOptions} options
 * @returns {Promise<void>}
 */
async function clean({platforms, debug}) {
    const enabledPlatforms = Object.values(PLATFORM).filter(
        (platform) => platform !== PLATFORM.API && platforms[platform]
    );

    await Promise.all(
        enabledPlatforms.map((platform) =>
            removeFolder(getDestDir({debug, platform}))
        )
    );
}

const cleanTask = createTask('clean', clean);

export default cleanTask;
