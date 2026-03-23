import type {ImageDetails} from './dynamic-theme/image';

const STORAGE_KEY_WAS_ENABLED_FOR_HOST = '__darkplease__wasEnabledForHost';
const STORAGE_KEY_IMAGE_DETAILS_LIST = '__darkplease__imageDetails_v2_list';
const STORAGE_KEY_IMAGE_DETAILS_PREFIX = '__darkplease__imageDetails_v2_';
const STORAGE_KEY_CSS_FETCH_PREFIX = '__darkplease__cssFetch_';
const LEGACY_STORAGE_KEY_WAS_ENABLED_FOR_HOST = '__darkplease__wasEnabledForHost';
const LEGACY_STORAGE_KEY_IMAGE_DETAILS_LIST = '__darkplease__imageDetails_v2_list';
const LEGACY_STORAGE_KEY_IMAGE_DETAILS_PREFIX = '__darkplease__imageDetails_v2_';
const LEGACY_STORAGE_KEY_CSS_FETCH_PREFIX = '__darkplease__cssFetch_';

let storageMigrated = false;

function migrateLegacySessionStorage(): void {
    if (storageMigrated) {
        return;
    }

    storageMigrated = true;

    try {
        if (!sessionStorage.getItem(STORAGE_KEY_WAS_ENABLED_FOR_HOST)) {
            const legacyValue = sessionStorage.getItem(LEGACY_STORAGE_KEY_WAS_ENABLED_FOR_HOST);
            if (legacyValue) {
                sessionStorage.setItem(STORAGE_KEY_WAS_ENABLED_FOR_HOST, legacyValue);
                sessionStorage.removeItem(LEGACY_STORAGE_KEY_WAS_ENABLED_FOR_HOST);
            }
        }

        if (!sessionStorage.getItem(STORAGE_KEY_IMAGE_DETAILS_LIST)) {
            const legacyList = sessionStorage.getItem(LEGACY_STORAGE_KEY_IMAGE_DETAILS_LIST);
            if (legacyList) {
                sessionStorage.setItem(STORAGE_KEY_IMAGE_DETAILS_LIST, legacyList);

                const urls: string[] = JSON.parse(legacyList);
                urls.forEach((url) => {
                    const newKey = `${STORAGE_KEY_IMAGE_DETAILS_PREFIX}${url}`;
                    if (!sessionStorage.getItem(newKey)) {
                        const legacyKey = `${LEGACY_STORAGE_KEY_IMAGE_DETAILS_PREFIX}${url}`;
                        const legacyDetails = sessionStorage.getItem(legacyKey);
                        if (legacyDetails) {
                            sessionStorage.setItem(newKey, legacyDetails);
                            sessionStorage.removeItem(legacyKey);
                        }
                    }
                });

                sessionStorage.removeItem(LEGACY_STORAGE_KEY_IMAGE_DETAILS_LIST);
            }
        }
    } catch (err) {
    }
}

export function wasEnabledForHost(): boolean | null {
    try {
        migrateLegacySessionStorage();
        const value = sessionStorage.getItem(STORAGE_KEY_WAS_ENABLED_FOR_HOST);
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
    } catch (err) {
    }
    return null;
}

export function writeEnabledForHost(value: boolean): void {
    try {
        sessionStorage.setItem(STORAGE_KEY_WAS_ENABLED_FOR_HOST, value ? 'true' : 'false');
    } catch (err) {
    }
}

let imageCacheTimeout: any = 0;
const imageDetailsCacheQueue = new Map<string, ImageDetails>();
const cachedImageUrls: string[] = [];

function writeImageDetailsQueue() {
    migrateLegacySessionStorage();
    imageDetailsCacheQueue.forEach((details, url) => {
        if (url && url.startsWith('https://')) {
            try {
                const json = JSON.stringify(details);
                sessionStorage.setItem(`${STORAGE_KEY_IMAGE_DETAILS_PREFIX}${url}`, json);
                cachedImageUrls.push(url);
            } catch (err) {
            }
        }
    });
    imageDetailsCacheQueue.clear();
    sessionStorage.setItem(STORAGE_KEY_IMAGE_DETAILS_LIST, JSON.stringify(cachedImageUrls));
}

export function writeImageDetailsCache(url: string, imageDetails: ImageDetails): void {
    if (!url || !url.startsWith('https://')) {
        return;
    }
    imageDetailsCacheQueue.set(url, imageDetails);
    clearTimeout(imageCacheTimeout);
    imageCacheTimeout = setTimeout(writeImageDetailsQueue, 1000);
}

export function readImageDetailsCache(targetMap: Map<string, ImageDetails>): void {
    try {
        migrateLegacySessionStorage();
        const jsonList = sessionStorage.getItem(STORAGE_KEY_IMAGE_DETAILS_LIST);
        if (!jsonList) {
            return;
        }
        const list: string[] = JSON.parse(jsonList);
        list.forEach((url) => {
            const json = sessionStorage.getItem(`${STORAGE_KEY_IMAGE_DETAILS_PREFIX}${url}`);
            if (json) {
                const details = JSON.parse(json);
                targetMap.set(url, details);
            }
        });
    } catch (err) {
    }
}

export function writeCSSFetchCache(url: string, cssText: string): void {
    migrateLegacySessionStorage();
    const key = `${STORAGE_KEY_CSS_FETCH_PREFIX}${url}`;
    try {
        sessionStorage.setItem(key, cssText);
    } catch (err) {
    }
}

export function readCSSFetchCache(url: string): string | null {
    migrateLegacySessionStorage();
    const key = `${STORAGE_KEY_CSS_FETCH_PREFIX}${url}`;
    try {
        const currentValue = sessionStorage.getItem(key);
        if (currentValue != null) {
            return currentValue;
        }

        const legacyKey = `${LEGACY_STORAGE_KEY_CSS_FETCH_PREFIX}${url}`;
        const legacyValue = sessionStorage.getItem(legacyKey);
        if (legacyValue != null) {
            sessionStorage.setItem(key, legacyValue);
            sessionStorage.removeItem(legacyKey);
            return legacyValue;
        }

        return null;
    } catch (err) {
    }
    return null;
}
