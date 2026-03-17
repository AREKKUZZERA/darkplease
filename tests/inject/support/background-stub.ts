import type {MessageBGtoCS, MessageCStoBG} from '../../../src/definitions';
import {MessageTypeBGtoCS, MessageTypeCStoBG} from '../../../src/utils/message';

let nativeSendMessage: typeof chrome.runtime.sendMessage;
const bgResponses = new Map<string, string>();

function normalizeURL(url: string): string {
    try {
        return new URL(url).href;
    } catch {
        return url;
    }
}

export function stubChromeRuntimeMessage(): void {
    nativeSendMessage = chrome.runtime.sendMessage;
    const listeners: Array<(message: MessageBGtoCS) => void> = (chrome.runtime.onMessage as any)['__listeners__'];

    (chrome.runtime as any).sendMessage = (message: MessageCStoBG) => {
        if (message.type === MessageTypeCStoBG.FETCH) {
            const {id, data: {url}} = message;
            setTimeout(() => {
                try {
                    const normalizedUrl = normalizeURL(url);
                    let error = null;
                    let data = '';
                    if (!bgResponses.has(normalizedUrl)) {
                        console.warn(`STUB MISS. Requested: ${url}`);
                        console.warn(`Normalized: ${normalizedUrl}`);
                        console.warn(`Registered keys:`, [...bgResponses.keys()]);
                        error = `Response is missing, use \`stubBackgroundFetchResponse()\` for URL: ${url}`;
                    } else {
                        data = bgResponses.get(normalizedUrl)!;
                    }
                    listeners.forEach((listener) => {
                        listener({type: MessageTypeBGtoCS.FETCH_RESPONSE, data, error, id});
                    });
                } catch (err) {
                    console.error('Error in stub message handler:', err);
                    listeners.forEach((listener) => {
                        listener({type: MessageTypeBGtoCS.FETCH_RESPONSE, data: '', error: String(err), id});
                    });
                }
            });
        }
    };
}

export function resetChromeRuntimeMessageStub(): void {
    chrome.runtime.sendMessage = nativeSendMessage;
    bgResponses.clear();
}

export function stubBackgroundFetchResponse(url: string, content: string): void {
    bgResponses.set(normalizeURL(url), content);
}

const urlResponses = new Map<string, string>();
export function stubChromeRuntimeGetURL(path: string, url: string): void {
    urlResponses.set(path, url);
    (chrome.runtime as any).getURL = (path: string) => {
        return urlResponses.get(path);
    };
}
