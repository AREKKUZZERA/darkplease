import {m} from 'malevic';
import {sync} from 'malevic/dom';

import type {DevToolsData, ExtensionData} from '../../definitions';
import Connector from '../connect/connector';

import Body from './components/body';

declare const __CHROMIUM_MV3__: boolean;
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

function renderBody(data: ExtensionData, devToolsData: DevToolsData, actions: Connector) {
    sync(document.body, <Body data={data} devtools={devToolsData} actions={actions} />);
}

async function start(): Promise<void> {
    const connector = new Connector();
    window.addEventListener('unload', () => connector.disconnect(), {passive: true});

    let [data, devToolsData] = await Promise.all([
        connector.getData(),
        connector.getDevToolsData(),
    ]);

    renderBody(data, devToolsData, connector);

    connector.subscribeToChanges(async (data_) => {
        data = data_;
        devToolsData = await connector.getDevToolsData();
        renderBody(data, devToolsData, connector);
    });
}

start();

if (__TEST__) {
    const popupTestPort = getPopupTestPort();
    const socket = new WebSocket(`ws://localhost:${popupTestPort}`);

    socket.onopen = async () => {
        socket.send(JSON.stringify({
            data: {
                type: 'devtools',
                uuid: `ready-${document.location.pathname}`,
            },
            id: null,
        }));
    };

    socket.onmessage = (e) => {
        const respond = (message: {id: number; data?: string | boolean; error?: string}) => {
            socket.send(JSON.stringify(message));
        };

        const message: {type: string; id: number; data: string} = JSON.parse(e.data);
        const {type, id, data} = message;

        try {
            const textarea: HTMLTextAreaElement = document.querySelector('.config-editor textarea.editor')!;
            const [buttonReset, buttonApply] = document.querySelectorAll('.config-editor .buttons button');

            switch (type) {
                case 'devtools-click': {
                    let attempts = 4;

                    const click = () => {
                        const element: HTMLElement | null = document.querySelector(data);
                        if (element) {
                            element.click();
                            respond({id, data: true});
                        } else if (attempts === 0) {
                            respond({id, data: false});
                        } else {
                            attempts--;
                            requestIdleCallback(click, {timeout: 500});
                        }
                    };

                    click();
                    break;
                }

                case 'devtools-exists': {
                    let attempts = 4;

                    const check = () => {
                        const element: HTMLElement | null = document.querySelector(data);
                        if (element) {
                            respond({id, data: true});
                        } else if (attempts === 0) {
                            respond({id, data: false});
                        } else {
                            attempts--;
                            requestIdleCallback(check, {timeout: 500});
                        }
                    };

                    check();
                    break;
                }

                case 'devtools-paste':
                    textarea.value = data;
                    (buttonApply as HTMLButtonElement).click();
                    respond({id});
                    break;

                case 'devtools-reset':
                    respond({id});
                    (buttonReset as HTMLButtonElement).click();
                    (document.querySelector('button.message-box__button-ok') as HTMLButtonElement).click();
                    break;
            }
        } catch (err) {
            respond({id, error: String(err)});
        }
    };
}

if (__CHROMIUM_MV3__) {
    // See getExtensionPageTabMV3() for explanation of what it is
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
        if (message === 'getExtensionPageTabMV3_ping') {
            sendResponse('getExtensionPageTabMV3_pong');
        }
    });
}
