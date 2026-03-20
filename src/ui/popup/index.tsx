import {m} from 'malevic';
import {sync} from 'malevic/dom';

import type {ExtensionData, ExtensionActions, DebugMessageBGtoCS, DebugMessageBGtoUI} from '../../definitions';
import {DebugMessageTypeBGtoUI} from '../../utils/message';
import {isMobile, isFirefox} from '../../utils/platform';
import Connector from '../connect/connector';
import {getFontList, saveFile} from '../utils';

import Body from './components/body';
import {fixNotClosingPopupOnNavigation} from './utils/issues';
import {initAltUI, shouldUseAltUI} from '@plus/popup/plus-body';

declare const __PLUS__: boolean;
declare const __DEBUG__: boolean;
declare const __TEST__: boolean;

/**
 * Optional build-time/test-time constant.
 */
declare const __POPUP_TEST_PORT__: number | undefined;

function getPopupTestPort(): number {
    const globalPort =
        typeof globalThis !== 'undefined' &&
        '__POPUP_TEST_PORT__' in globalThis &&
        typeof (globalThis as {__POPUP_TEST_PORT__?: unknown}).__POPUP_TEST_PORT__ === 'number'
            ? (globalThis as {__POPUP_TEST_PORT__?: number}).__POPUP_TEST_PORT__
            : undefined;

    const definedPort =
        typeof __POPUP_TEST_PORT__ !== 'undefined' && typeof __POPUP_TEST_PORT__ === 'number'
            ? __POPUP_TEST_PORT__
            : undefined;

    return globalPort ?? definedPort ?? 8894;
}

function renderBody(
    data: ExtensionData,
    fonts: string[],
    installation: {date: number; version: string},
    actions: ExtensionActions,
) {
    if (data.settings.previewNewDesign) {
        if (!document.documentElement.classList.contains('preview')) {
            document.documentElement.classList.add('preview');
        }
    } else if (document.documentElement.classList.contains('preview')) {
        document.documentElement.classList.remove('preview');
    }

    sync(document.body, (
        <Body data={data} actions={actions} fonts={fonts} installation={installation} />
    ));
}

async function getInstallationData() {
    return new Promise<any>((resolve) => {
        chrome.storage.local.get<Record<string, any>>({installation: {}}, (data) => {
            if (data?.installation?.version) {
                resolve(data.installation);
            } else {
                resolve({});
            }
        });
    });
}

async function start() {
    if (__PLUS__ && shouldUseAltUI()) {
        return await initAltUI();
    }

    const connector = new Connector();
    window.addEventListener('unload', () => connector.disconnect(), {passive: true});

    const [data, fonts, installation] = await Promise.all([
        connector.getData(),
        getFontList(),
        getInstallationData(),
    ]);

    renderBody(data, fonts, installation, connector);
    connector.subscribeToChanges((data_) => renderBody(data_, fonts, installation, connector));
}

window.addEventListener('load', start, {passive: true});

document.documentElement.classList.toggle('mobile', isMobile);
document.documentElement.classList.toggle('firefox', isFirefox);

if (isFirefox) {
    fixNotClosingPopupOnNavigation();
}

if (__DEBUG__) {
    chrome.runtime.onMessage.addListener(({type}: DebugMessageBGtoCS | DebugMessageBGtoUI) => {
        if (type === DebugMessageTypeBGtoUI.CSS_UPDATE) {
            document.querySelectorAll('link[rel="stylesheet"]').forEach((link: Element) => {
                const stylesheetLink = link as HTMLLinkElement;
                const url = stylesheetLink.href;
                stylesheetLink.disabled = true;

                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = url.replace(/\?.*$/, `?nocache=${Date.now()}`);

                stylesheetLink.parentElement!.insertBefore(newLink, stylesheetLink);
                stylesheetLink.remove();
            });
        }

        if (type === DebugMessageTypeBGtoUI.UPDATE) {
            location.reload();
        }
    });
}

if (__TEST__) {
    const popupTestPort = getPopupTestPort();
    const socket = new WebSocket(`ws://localhost:${popupTestPort}`);

    socket.onopen = async () => {
        socket.send(JSON.stringify({
            data: {
                type: 'popup',
                uuid: `ready-${document.location.pathname}`,
            },
            id: null,
        }));
    };

    socket.onmessage = (e) => {
        const respond = (message: {id?: number; data?: any; error?: string}) => {
            socket.send(JSON.stringify(message));
        };

        try {
            const message: {type: string; id: number; data: any} = JSON.parse(e.data);
            const {type, id, data} = message;

            switch (type) {
                case 'popup-click': {
                    const check = () => {
                        const element: HTMLElement | null = document.querySelector(data);
                        if (element) {
                            element.click();
                            respond({id});
                        } else {
                            requestIdleCallback(check, {timeout: 500});
                        }
                    };

                    check();
                    break;
                }

                case 'popup-exists': {
                    const check = () => {
                        const element: HTMLElement | null = document.querySelector(data);
                        if (element) {
                            respond({id, data: true});
                        } else {
                            requestIdleCallback(check, {timeout: 500});
                        }
                    };

                    check();
                    break;
                }

                case 'popup-saveFile': {
                    const {name, content} = data;
                    saveFile(name, content);
                    respond({id});
                    break;
                }

                default:
                    break;
            }
        } catch (err) {
            respond({error: String(err)});
        }
    };
}
