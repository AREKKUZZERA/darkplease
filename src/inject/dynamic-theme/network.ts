import type {MessageBGtoCS, MessageCStoBG} from '../../definitions';
import {MessageTypeBGtoCS, MessageTypeCStoBG} from '../../utils/message';
import {generateUID} from '../../utils/uid';
import {isExtensionContextInvalidatedError, isExtensionContextValid} from '../utils/extension-context';

interface FetchRequest {
    url: string;
    responseType: 'data-url' | 'text';
    mimeType?: string;
    origin: string;
}

declare const __TEST__: boolean;

const resolvers = new Map<string, (data: string) => void>();
const rejectors = new Map<string, (reason?: any) => void>();

function rejectAllPendingRequests(reason: Error) {
    rejectors.forEach((reject) => reject(reason));
    resolvers.clear();
    rejectors.clear();
}

export async function bgFetch(request: FetchRequest): Promise<string> {
    if ((window as any).DarkPlease?.Plugins?.fetch) {
        return (window as any).DarkPlease.Plugins.fetch(request);
    }
    const parsedURL = new URL(request.url);
    if (parsedURL.origin !== request.origin && shouldIgnoreCors(parsedURL)) {
        throw new Error('Cross-origin limit reached');
    }
    return new Promise<string>((resolve, reject) => {
        if (!isExtensionContextValid()) {
            reject(new Error('Extension context invalidated.'));
            return;
        }

        const id = generateUID();
        resolvers.set(id, resolve);
        rejectors.set(id, reject);

        try {
            const sendMessageResult = chrome.runtime.sendMessage<MessageCStoBG>({type: MessageTypeCStoBG.FETCH, data: request, id});
            if (sendMessageResult && typeof (sendMessageResult as Promise<unknown>).catch === 'function') {
                (sendMessageResult as Promise<unknown>).catch((error) => {
                    resolvers.delete(id);
                    rejectors.delete(id);
                    if (isExtensionContextInvalidatedError(error)) {
                        reject(error);
                        rejectAllPendingRequests(new Error('Extension context invalidated.'));
                        return;
                    }
                    reject(error);
                });
            }
        } catch (error) {
            resolvers.delete(id);
            rejectors.delete(id);
            reject(error);
            if (isExtensionContextInvalidatedError(error)) {
                rejectAllPendingRequests(new Error('Extension context invalidated.'));
            }
        }
    });
}

if (isExtensionContextValid()) {
    try {
        chrome.runtime.onMessage.addListener(({type, data, error, id}: MessageBGtoCS) => {
            if (type === MessageTypeBGtoCS.FETCH_RESPONSE) {
                const resolve = resolvers.get(id!);
                const reject = rejectors.get(id!);
                resolvers.delete(id!);
                rejectors.delete(id!);
                if (error) {
                    reject && reject(typeof error === 'string' ? new Error(error) : error);
                } else {
                    resolve && resolve(data);
                }
            }
        });
    } catch (error) {
        if (isExtensionContextInvalidatedError(error)) {
            rejectAllPendingRequests(new Error('Extension context invalidated.'));
        }
    }
}

const ipV4RegExp = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
const MAX_CORS_HOSTS = 16;
const corsHosts = new Set<string>();
const checkedHosts = new Set<string>();
const localAliases = [
    '127-0-0-1.org.uk',
    '42foo.com',
    'domaincontrol.com',
    'fbi.com',
    'fuf.me',
    'lacolhost.com',
    'local.sisteminha.com',
    'localfabriek.nl',
    'localhost',
    'localhst.co.uk',
    'localmachine.info',
    'localmachine.name',
    'localtest.me',
    'lvh.me',
    'mouse-potato.com',
    'nip.io',
    'sslip.io',
    'vcap.me',
    'xip.io',
    'yoogle.com',
];
const localSubDomains = [
    '.corp',
    '.direct',
    '.home',
    '.internal',
    '.intranet',
    '.lan',
    '.local',
    '.localdomain',
    '.test',
    '.zz',
    ...localAliases.map((alias) => `.${alias}`),
];

function shouldIgnoreCors(url: URL) {
    if (__TEST__) {
        return false;
    }
    const {host, hostname, port, protocol} = url;
    if (!corsHosts.has(host)) {
        corsHosts.add(host);
    }
    if (checkedHosts.has(host)) {
        return false;
    }
    if (
        corsHosts.size >= MAX_CORS_HOSTS ||
        protocol !== 'https:' ||
        port !== '' ||
        localAliases.includes(hostname) ||
        localSubDomains.some((sub) => hostname.endsWith(sub)) ||
        hostname.startsWith('[') ||
        hostname.match(ipV4RegExp)
    ) {
        return true;
    }
    checkedHosts.add(host);
    return false;
}
