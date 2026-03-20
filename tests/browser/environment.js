import {TestEnvironment} from 'jest-environment-node';
import {launch, connect} from 'puppeteer-core';
import {WebSocketServer} from 'ws';

import {generateHTMLCoverageReports} from './coverage.js';
import {
    getChromePath,
    getFirefoxPath,
    chromeExtensionDebugDir,
    chromeMV3ExtensionDebugDir,
    chromePlusExtensionDebugDir,
    firefoxExtensionDebugDir,
    getEdgePath,
} from './paths.js';
import {createTestServer, generateRandomId} from './server.js';

const TEST_SERVER_PORT = 8891;
const CORS_SERVER_PORT = 8892;
const FIREFOX_DEVTOOLS_PORT = 8893;
const POPUP_TEST_PORT = 8894;
const MESSAGE_SERVER_STARTUP_TIMEOUT_MS = 15000;

export default class CustomJestEnvironment extends TestEnvironment {
    /** @type {Array<() => void>} */
    extensionStartListeners = [];
    pageEventListeners = new Map();

    /** @type {import('puppeteer-core').Browser | undefined} */
    browser;
    /** @type {WebSocketServer | undefined} */
    messageServer;
    /** @type {ReturnType<typeof createTestServer> | undefined} */
    testServer;
    /** @type {ReturnType<typeof createTestServer> | undefined} */
    corsServer;
    /** @type {import('puppeteer-core').Page | undefined} */
    page;
    /** @type {string | undefined} */
    extensionOrigin;

    async setup() {
        await super.setup();

        const messageServerPromise = this.createMessageServer();
        const browserPromise = this.launchBrowser();

        const [messageServer, browser] = await Promise.all([
            messageServerPromise,
            browserPromise,
        ]);

        this.messageServer = messageServer;
        this.browser = browser;

        const [testServer, corsServer, page] = await Promise.all([
            createTestServer(TEST_SERVER_PORT),
            createTestServer(CORS_SERVER_PORT),
            this.createTestPage(),
        ]);

        this.testServer = testServer;
        this.corsServer = corsServer;
        this.page = page;

        this.assignTestGlobals(this.global, this.testServer, this.corsServer, this.page);
    }

    /**
     * @returns {Promise<void>}
     */
    async waitForStartup() {
        if (this.extensionOrigin) {
            return;
        }
        return new Promise((ready) => this.extensionStartListeners.push(ready));
    }

    /**
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launchBrowser() {
        let browser;
        if (this.global.product === 'edge') {
            browser = await this.launchEdge();
        } else if (this.global.product === 'chrome-mv3') {
            browser = await this.launchChrome();
        } else if (this.global.product === 'chrome' || this.global.product === 'chrome-mv2') {
            browser = await this.launchChromeMV2();
        } else if (this.global.product === 'firefox') {
            browser = await this.launchFirefox();
        } else {
            throw new Error(`Unsupported product: ${this.global.product}`);
        }

        await this.waitForStartup();
        return browser;
    }

    /**
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launchChrome() {
        const extensionDir = chromeMV3ExtensionDebugDir;
        let executablePath;
        try {
            executablePath = await getChromePath();
        } catch (e) {
            console.error(e);
        }

        return await launch({
            args: [
                '--show-component-extension-options',
            ],
            enableExtensions: [extensionDir],
            executablePath,
            headless: false,
            pipe: true,
        });
    }

    /**
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launchChromeMV2() {
        const extensionDir = chromeExtensionDebugDir;
        let executablePath;
        try {
            executablePath = await getChromePath();
        } catch (e) {
            console.error(e);
        }

        return await launch({
            args: [
                '--show-component-extension-options',
            ],
            enableExtensions: [extensionDir],
            executablePath,
            headless: false,
            pipe: true,
        });
    }

    /**
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launchEdge() {
        const extensionDir = chromePlusExtensionDebugDir;
        let executablePath;
        try {
            executablePath = await getEdgePath();
        } catch (e) {
            console.error(e);
        }

        return await launch({
            args: [
                '--show-component-extension-options',
            ],
            enableExtensions: [extensionDir],
            executablePath,
            headless: false,
            pipe: true,
        });
    }

    /**
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launchFirefoxPuppeteer() {
        const retries = 10;
        const retryIntervalInMs = 500;

        for (let i = 0; i < retries; i++) {
            await new Promise((resolve) => setTimeout(resolve, retryIntervalInMs));
            try {
                return await connect({
                    browserURL: `http://localhost:${FIREFOX_DEVTOOLS_PORT}`,
                });
            } catch (err) {
                console.log(`Firefox connection attempt ${i + 1} failed:`, err);
            }
        }

        throw new Error('Failed to connect to Puppeteer');
    }

    /**
     * @returns {Promise<import('puppeteer-core').Browser>}
     */
    async launchFirefox() {
        const firefox = await getFirefoxPath();
        const {cmd} = await import('web-ext');

        await cmd.run({
            sourceDir: firefoxExtensionDebugDir,
            firefox,
            noReload: true,
            args: ['--remote-debugging-port', FIREFOX_DEVTOOLS_PORT],
        }, {
            shouldExitProgram: false,
        });

        return await this.launchFirefoxPuppeteer();
    }

    async createTestPage() {
        if (this.global.product === 'firefox') {
            return undefined;
        }

        const page = await this.browser.newPage();
        page.on('pageerror', (err) => process.emit('uncaughtException', err));
        await page.coverage.startJSCoverage();
        return page;
    }

    async getURL(path) {
        await this.waitForStartup();
        const url = new URL(path, this.extensionOrigin);
        return url.href;
    }

    async getChromiumMV2BackgroundPage() {
        const targets = this.browser.targets();
        const backgroundTarget = targets.find((t) => t.type() === 'background_page');
        return await backgroundTarget.page();
    }

    async awaitForEvent(uuid) {
        return new Promise((resolve) => {
            if (this.pageEventListeners.has(uuid)) {
                this.pageEventListeners.get(uuid).push(resolve);
            } else {
                this.pageEventListeners.set(uuid, [resolve]);
            }
        });
    }

    /**
     * @param {import('puppeteer-core').Page} page
     * @param {string} url
     * @param {import('puppeteer-core').WaitForOptions} gotoOptions
     * @returns {Promise<void>}
     */
    async pageGoto(url, gotoOptions) {
        const pathname = new URL(url).pathname;
        const promise = this.awaitForEvent(`ready-${pathname}`);

        if (this.global.product !== 'firefox') {
            await this.page.goto(url, gotoOptions);
        } else {
            await this.global.backgroundUtils.createTab(url);
        }

        await promise;
    }

    async openTestPage(url, gotoOptions) {
        if (this.global.product !== 'firefox') {
            await this.page.bringToFront();
        }
        await this.pageGoto(url, gotoOptions);
    }

    onPageEventResponse(eventUUID) {
        const resolves = this.pageEventListeners.get(eventUUID);
        this.pageEventListeners.delete(eventUUID);
        resolves && resolves.forEach((r) => r());
    }

    /**
     * This function is evaluated within browser's page context
     * after being passed to page.evaluate()
     * It can use methods which will be defined in the page context,
     * but can not use variables defined in this file besides those passed into it.
     */
    async checkPageStylesInBrowserContext(expectations) {
        const checkOne = (expectation) => {
            const [selector, cssAttributeName, expectedValue] = expectation;
            const selector_ = Array.isArray(selector) ? selector : [selector];
            let element = document;

            for (const part of selector_) {
                if (element instanceof HTMLIFrameElement) {
                    element = element.contentDocument;
                }
                if (element.shadowRoot instanceof ShadowRoot) {
                    element = element.shadowRoot;
                }
                if (part === 'document') {
                    element = element.documentElement;
                } else {
                    element = element.querySelector(part);
                }
                if (!element) {
                    return `Could not find element ${part}`;
                }
            }

            const style = getComputedStyle(element);
            if (style[cssAttributeName] !== expectedValue) {
                return `Expected ${selector_.join(' ')} '${cssAttributeName}' to be '${expectedValue}', but got '${style[cssAttributeName]}'`;
            }
        };

        const checkAll = () => {
            /** @type {string[]} */
            const errors = [];
            for (let i = 0; i < expectations.length; i++) {
                const error = checkOne(expectations[i]);
                if (error) {
                    errors.push(error);
                }
            }
            return errors;
        };

        let timeout = 10;
        let errors = checkAll();
        for (let i = 0; errors.length !== 0 && i < 10; i++) {
            timeout *= 2;
            await new Promise((r) => requestIdleCallback(r, {timeout}));
            errors = checkAll();
        }
        return errors;
    }

    assignTestGlobals(global, testServer, corsServer, page) {
        global.getColorScheme = async () => {
            if (global.product === 'firefox') {
                return await global.backgroundUtils.getColorScheme();
            }
            const isDark = await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches);
            return isDark ? 'dark' : 'light';
        };

        global.pageUtils.evaluateScript = async (script) => {
            if (global.product === 'firefox') {
                if (typeof script !== 'function') {
                    throw new Error('Not implemented');
                }
                return await global.pageUtils.evaluate(`(${script.toString()})()`);
            }
            return await page.evaluate(script);
        };

        global.expectPageStyles = async (expect, expectations) => {
            if (global.product === 'firefox') {
                const errors = await global.pageUtils.expectPageStyles(expectations);
                expect(errors.length).toBe(0);
                return;
            }

            if (!Array.isArray(expectations[0])) {
                expectations = [expectations];
            }

            const errors = await page.evaluate(this.checkPageStylesInBrowserContext, expectations);
            expect(errors.join('\n')).toBe('');
        };

        global.emulateColorScheme = async (colorScheme) => {
            if (global.product === 'firefox') {
                await global.pageUtils.emulateColorScheme(colorScheme);
                await global.backgroundUtils.emulateColorScheme(colorScheme);
                const newPageColorScheme = await global.backgroundUtils.getColorScheme();
                const newBGColorScheme = await global.pageUtils.getColorScheme();
                if (newPageColorScheme !== colorScheme || newBGColorScheme !== colorScheme) {
                    throw new Error('Failed to apply new color scheme');
                }
                return;
            }

            await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: colorScheme}]);
            if (global.product === 'edge') {
                const bgPage = await this.getChromiumMV2BackgroundPage();
                await bgPage.emulateMediaFeatures([{name: 'prefers-color-scheme', value: colorScheme}]);
            }
        };

        global.loadTestPage = async (paths, gotoOptions) => {
            const {cors, ...testPaths} = paths;
            testServer.setPaths(testPaths);
            cors && corsServer.setPaths(cors);
            await this.openTestPage(`http://localhost:${TEST_SERVER_PORT}`, gotoOptions);
        };

        global.corsURL = corsServer.url;
    }

    /**
     * Creates a server and returns once extension connects to it
     * @returns {Promise<WebSocketServer>}
     */
    async createMessageServer() {
        if (this.messageServer) {
            return this.messageServer;
        }

        const awaitForEvent = this.awaitForEvent.bind(this);

        return new Promise((resolve, reject) => {
            let settled = false;

            const fail = (error) => {
                if (settled) {
                    return;
                }
                settled = true;
                reject(error);
            };

            const succeed = (server) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(startupTimeout);
                resolve(server);
            };

            let wsServer;
            try {
                wsServer = new WebSocketServer({port: POPUP_TEST_PORT});
            } catch (error) {
                fail(error);
                return;
            }

            const startupTimeout = setTimeout(() => {
                try {
                    wsServer.close();
                } catch {
                    // ignore
                }
                fail(new Error(`Timed out waiting for extension background to connect on port ${POPUP_TEST_PORT}`));
            }, MESSAGE_SERVER_STARTUP_TIMEOUT_MS);

            wsServer.on('error', (error) => {
                clearTimeout(startupTimeout);
                fail(error);
            });

            let backgroundSocket = null;
            let devToolsSocket = null;
            const popupSockets = new Set();
            const pageSockets = new Set();
            const resolvers = new Map();
            const rejectors = new Map();

            let onDownloadCallback = null;

            wsServer.on('connection', async (ws) => {
                ws.on('message', (data) => {
                    let message;
                    try {
                        message = JSON.parse(data);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                        return;
                    }

                    if (message.id === null && message.data && message.data.type === 'background' && message.data.extensionOrigin) {
                        this.extensionOrigin = message.data.extensionOrigin;
                        this.extensionStartListeners.forEach((ready) => ready());
                        this.extensionStartListeners = [];
                        ws.on('close', () => {
                            backgroundSocket = null;
                        });
                        backgroundSocket = ws;
                        succeed(wsServer);
                    } else if (message.id === null && message.data && message.data.type === 'devtools') {
                        ws.on('close', () => {
                            devToolsSocket = null;
                        });
                        devToolsSocket = ws;
                        this.onPageEventResponse(message.data.uuid);
                    } else if (message.id === null && message.data && message.data.type === 'popup') {
                        ws.on('close', () => {
                            popupSockets.delete(ws);
                        });
                        popupSockets.add(ws);
                        this.onPageEventResponse(message.data.uuid);
                    } else if (message.id === null && message.data && message.data.type === 'page') {
                        if (message.data.message === 'page-ready') {
                            ws.on('close', () => {
                                pageSockets.delete(ws);
                            });
                            if (message.data.uuid === 'ready-/') {
                                pageSockets.add(ws);
                            }
                        }
                        this.onPageEventResponse(message.data.uuid);
                    } else if (message.id === null && message.data && message.data.type === 'download') {
                        if (onDownloadCallback) {
                            onDownloadCallback(message.data);
                        }
                    } else if (message.error) {
                        const rejectMessage = rejectors.get(message.id);
                        if (rejectMessage) {
                            rejectMessage(message.error);
                        }
                        resolvers.delete(message.id);
                        rejectors.delete(message.id);
                    } else {
                        const resolveMessage = resolvers.get(message.id);
                        if (resolveMessage) {
                            resolveMessage(message.data);
                        }
                        resolvers.delete(message.id);
                        rejectors.delete(message.id);
                    }
                });

                ws.on('error', (error) => {
                    console.error('WebSocket connection error:', error);
                });
            });

            function sendToContext(sockets, type, data) {
                return new Promise((resolve, reject) => {
                    const validSockets = sockets.filter(Boolean);

                    if (validSockets.length === 0) {
                        reject(new Error(`No active socket available for message type "${type}"`));
                        return;
                    }

                    const id = generateRandomId();
                    resolvers.set(id, resolve);
                    rejectors.set(id, reject);

                    const json = JSON.stringify({type, data, id});

                    let pending = validSockets.length;
                    let sendFailed = false;

                    for (const ws of validSockets) {
                        ws.send(json, (error) => {
                            if (sendFailed) {
                                return;
                            }

                            if (error) {
                                sendFailed = true;
                                resolvers.delete(id);
                                rejectors.delete(id);
                                reject(error);
                                return;
                            }

                            pending -= 1;
                            if (pending === 0) {
                                // Wait for response message to resolve promise
                            }
                        });
                    }
                });
            }

            function sendToPopup(type, data) {
                return sendToContext(Array.from(popupSockets), type, data);
            }

            function sendToDevTools(type, data) {
                return sendToContext([devToolsSocket], type, data);
            }

            function sendToBackground(type, data) {
                return sendToContext([backgroundSocket], type, data);
            }

            function sendToPage(type, data) {
                return sendToContext(Array.from(pageSockets), type, data);
            }

            async function applyDevtoolsConfig(type, fixes) {
                const promise = awaitForEvent('darkplease-dynamic-theme-ready');
                await Promise.all([
                    sendToDevTools(type, fixes),
                    promise,
                ]);
            }

            this.global.popupUtils = {
                saveFile: async (name, content) => sendToPopup('popup-saveFile', {name, content}),
                click: async (selector) => await sendToPopup('popup-click', selector),
                exists: async (selector) => await sendToPopup('popup-exists', selector),
            };

            this.global.devtoolsUtils = {
                click: async (selector) => await sendToDevTools('devtools-click', selector),
                exists: async (selector) => await sendToDevTools('devtools-exists', selector),
                paste: async (fixes) => await applyDevtoolsConfig('devtools-paste', fixes),
                reset: async () => await applyDevtoolsConfig('devtools-reset'),
            };

            this.global.backgroundUtils = {
                changeSettings: async (settings) => await sendToBackground('changeSettings', settings),
                collectData: async () => await sendToBackground('collectData'),
                changeChromeStorage: async (region, data) => await sendToBackground('changeChromeStorage', {region, data}),
                getChromeStorage: async (region, keys) => await sendToBackground('getChromeStorage', {region, keys}),
                getManifest: async () => await sendToBackground('getManifest'),
                getColorScheme: async () => {
                    if (this.global.product !== 'firefox') {
                        throw new Error('Not supported');
                    }
                    return await sendToBackground('firefox-getColorScheme');
                },
                createTab: async (url) => {
                    if (this.global.product !== 'firefox') {
                        throw new Error('Not supported');
                    }
                    await sendToBackground('firefox-createTab', url);
                },
                emulateColorScheme: async (colorScheme) => {
                    if (this.global.product !== 'firefox') {
                        throw new Error('Not supported');
                    }
                    await sendToBackground('firefox-emulateColorScheme', colorScheme);
                },
                setNews: async (news) => await sendToBackground('setNews', news),
                onDownload: (callback) => {
                    onDownloadCallback = callback;
                },
            };

            this.global.pageUtils = {
                evaluate: async (script) => await sendToPage('firefox-eval', script),
                expectPageStyles: async (expectations) => await sendToPage('firefox-expectPageStyles', expectations),
                emulateColorScheme: async (colorScheme) => await sendToPage('firefox-emulateColorScheme', colorScheme),
                getColorScheme: async () => {
                    if (this.global.product !== 'firefox') {
                        throw new Error('Not supported');
                    }
                    return await sendToPage('firefox-getColorScheme');
                },
            };

            this.global.awaitForEvent = awaitForEvent;
        });
    }

    /**
     * @returns {Promise<void>}
     */
    async teardown() {
        const promises = [];

        try {
            if (this.global.product !== 'firefox' && this.page?.coverage) {
                const coverage = await this.page.coverage.stopJSCoverage();
                const dir = './tests/browser/coverage/';
                const promise = generateHTMLCoverageReports(dir, coverage);
                promise.then(() => console.info('Coverage reports generated in', dir));
                promises.push(promise);
            }
        } catch (error) {
            console.error('Failed to generate coverage reports:', error);
        }

        if (this.testServer) {
            promises.push(Promise.resolve(this.testServer.close()));
        }

        if (this.corsServer) {
            promises.push(Promise.resolve(this.corsServer.close()));
        }

        if (this.messageServer) {
            promises.push(new Promise((resolve, reject) => {
                this.messageServer.close((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            }));
        }

        if (this.browser) {
            promises.push(this.browser.close());
        }

        await Promise.allSettled(promises);

        await super.teardown();
    }
}
