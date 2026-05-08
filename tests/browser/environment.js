import {TestEnvironment} from 'jest-environment-node';
import {launch} from 'puppeteer-core';
import {WebSocketServer} from 'ws';

import {generateHTMLCoverageReports} from './coverage.js';
import {getChromePath, chromeMV3ExtensionDebugDir} from './paths.js';
import {createTestServer, generateRandomId} from './server.js';

const TEST_SERVER_PORT = 8891;
const CORS_SERVER_PORT = 8892;
const POPUP_TEST_PORT = 8894;

export default class CustomJestEnvironment extends TestEnvironment {
    /** @type {() => void} */
    extensionStartListeners = [];
    pageEventListeners = new Map();

    /** @type {Browser} */
    browser;
    /** @type {WebSocketServer} */
    messageServer;

    async setup() {
        await super.setup();

        const promises1 = [
            this.createMessageServer(),
            this.launchBrowser(),
        ];
        const promises2 = [
            createTestServer(TEST_SERVER_PORT),
            createTestServer(CORS_SERVER_PORT),
        ];

        const results1 = await Promise.all(promises1);
        this.messageServer = results1[0];
        this.browser = results1[1];

        promises2.push(
            this.createTestPage(),
        );

        const results2 = await Promise.all(promises2);
        this.testServer = results2[0];
        this.corsServer = results2[1];
        this.page = results2[2];

        // Wait for tabs to load?

        this.assignTestGlobals(this.global, this.testServer, this.corsServer, this.page);
    }

    /**
     * @returns {Promise<void>}
     */
    async waitForStartup() {
        if (!this.extensionOrigin) {
            return new Promise((ready) => this.extensionStartListeners.push(ready));
        }
    }

    /**
     * @returns {Promise<Browser>}
     */
    async launchBrowser() {
        const browser = await this.launchChrome();
        // Wait for the extension to start
        await this.waitForStartup();
        return browser;
    }

    /**
     * @returns {Promise<Browser>}
     */
    async launchChrome() {
        const extensionDir = chromeMV3ExtensionDebugDir;
        let executablePath;
        try {
            executablePath = await getChromePath();
        } catch (e) {
            console.error(e);
        }
        // Explanation of these options:
        // https://pptr.dev/guides/chrome-extensions
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

    async createTestPage() {
        const page = await this.browser.newPage();
        page.on('pageerror', (err) => process.emit('uncaughtException', err));
        await page.coverage.startJSCoverage();
        return page;
    }

    async getURL(path) {
        // By this point browser should be loaded and extension should be started, but
        // let's wait anuway
        await this.waitForStartup();
        const url = new URL(path, this.extensionOrigin);
        return url.href;
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
     * @param {Page} page
     * @param {string} url
     * @param {WaitForOptions} gotoOptions
     * @returns Promise which resolves when page loads
     */
    async pageGoto(url, gotoOptions) {
        // Normalize URL
        const pathname = new URL(url).pathname;
        // Depending on external circumstances, page may connect to server before page.goto() reolves
        const promise = this.awaitForEvent(`ready-${pathname}`);
        await this.page.goto(url, gotoOptions);
        await promise;
    }

    async openTestPage(url, gotoOptions) {
        await this.page.bringToFront();
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
            /** @type{Array<[number, string]>} */
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
        for (let i = 0; (errors.length !== 0) && (i < 10); i++) {
            timeout *= 2;
            await new Promise((r) => requestIdleCallback(r, {timeout}));
            errors = checkAll();
        }
        return errors;
    }

    assignTestGlobals(global, testServer, corsServer, page) {
        global.getColorScheme = async () => {
            const isDark = await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches);
            return isDark ? 'dark' : 'light';
        };

        global.pageUtils = {
            evaluateScript: async (script) => await page.evaluate(script),
        };

        global.expectPageStyles = async (expect, expectations) => {
            if (!Array.isArray(expectations[0])) {
                expectations = [expectations];
            }
            const errors = await page.evaluate(this.checkPageStylesInBrowserContext, expectations);
            expect(errors.join('\n')).toBe('');
        };

        global.emulateColorScheme = async (colorScheme) => {
            await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: colorScheme}]);
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
     * @returns {Promise<WebSocketServer>} server
     */
    async createMessageServer() {
        const awaitForEvent = this.awaitForEvent.bind(this);
        const getPagePathname = () => new URL(this.page.url()).pathname;

        return new Promise((resolve) => {
            const wsServer = new WebSocketServer({port: POPUP_TEST_PORT});
            let backgroundSocket = null;
            let devToolsSocket = null;
            const popupSockets = new Set();
            const resolvers = new Map();
            const rejectors = new Map();

            let onDownloadCallback = null;

            wsServer.on('connection', async (ws) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.id === null && message.data && message.data.type === 'background' && message.data.extensionOrigin) {
                        // This is the initial message which contains extension's URL origin
                        // and signals that extenstion is ready
                        this.extensionOrigin = message.data.extensionOrigin;
                        this.extensionStartListeners.forEach((ready) => ready());
                        ws.on('close', () => backgroundSocket = null);
                        backgroundSocket = ws;
                        resolve(wsServer);
                    } else if (message.id === null && message.data && message.data.type === 'devtools') {
                        ws.on('close', () => devToolsSocket = null);
                        devToolsSocket = ws;
                        this.onPageEventResponse(message.data.uuid);
                    } else if (message.id === null && message.data && message.data.type === 'popup') {
                        ws.on('close', () => popupSockets.delete(ws));
                        popupSockets.add(ws);
                        this.onPageEventResponse(message.data.uuid);
                    } else if (message.id === null && message.data && message.data.type === 'page') {
                        this.onPageEventResponse(message.data.uuid);
                    } else if (message.id === null && message.data && message.data.type === 'download') {
                        if (onDownloadCallback) {
                            onDownloadCallback(message.data);
                        }
                    } else if (message.error) {
                        const reject = rejectors.get(message.id);
                        reject(message.error);
                    } else {
                        const resolve = resolvers.get(message.id);
                        resolve(message.data);
                    }
                    resolvers.delete(message.id);
                    rejectors.delete(message.id);
                });
            });


            function sendToContext(sockets, type, data) {
                return new Promise((resolve, reject) => {
                    const id = generateRandomId();
                    resolvers.set(id, resolve);
                    rejectors.set(id, reject);
                    const json = JSON.stringify({type, data, id});
                    for (const ws of sockets) {
                        ws.send(json);
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

            async function applyDevtoolsConfig(type, fixes) {
                const pathname = getPagePathname();
                const promise = awaitForEvent(`darkplease-dynamic-theme-ready-${pathname}`);
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
                onDownload: (callback) => onDownloadCallback = callback,
            };

            this.global.awaitForEvent = awaitForEvent;
        });
    }

    /**
     * @returns {Promise<void>}
     */
    async teardown() {
        await super.teardown();

        const promises = [];
        if (this.page?.coverage) {
            const coverage = await this.page.coverage.stopJSCoverage();
            const dir = './tests/browser/coverage/';
            const promise = generateHTMLCoverageReports(dir, coverage);
            promise.then(() => console.info('Coverage reports generated in', dir));
            promises.push(promise);
        }

        const closeMessageServer = () => new Promise((resolve) => {
            if (!this.messageServer) {
                resolve();
                return;
            }
            this.messageServer.close(() => resolve());
        });

        // Note: this.browser.close() will close all tabs, so no need to close them
        // explicitly
        promises.push(
            this.testServer?.close(),
            this.corsServer?.close(),
            closeMessageServer(),
            this.browser?.close(),
        );
        await Promise.all(promises);
    }
}
