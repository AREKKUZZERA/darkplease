import type {MessageBGtoCS, MessageCStoBG} from '../definitions';
import {isSystemDarkModeEnabled, runColorSchemeChangeDetector, stopColorSchemeChangeDetector} from '../utils/media-query';
import {MessageTypeCStoBG} from '../utils/message';
import {setDocumentVisibilityListener, documentIsVisible, removeDocumentVisibilityListener} from '../utils/visibility';
import {isExtensionContextInvalidatedError, isExtensionContextValid} from './utils/extension-context';

let unloaded = false;

function cleanup() {
    unloaded = true;
    stopColorSchemeChangeDetector();
    removeDocumentVisibilityListener();
}

function sendMessage(message: MessageCStoBG): void {
    if (unloaded || !isExtensionContextValid()) {
        cleanup();
        return;
    }

    const responseHandler = (response: MessageBGtoCS | 'unsupportedSender' | undefined) => {
        // Vivaldi bug workaround. See TabManager for details.
        if (response === 'unsupportedSender') {
            cleanup();
        }
    };

    try {
        const sendMessageResult = chrome.runtime.sendMessage<MessageCStoBG, MessageBGtoCS | 'unsupportedSender'>(message);
        if (sendMessageResult && typeof (sendMessageResult as Promise<MessageBGtoCS | 'unsupportedSender'>).then === 'function') {
            (sendMessageResult as Promise<MessageBGtoCS | 'unsupportedSender'>).then(responseHandler).catch(cleanup);
        }
    } catch (error) {
        /*
         * We get here if Background context is unreachable which occurs when:
         *  - extension was disabled
         *  - extension was uninstalled
         *  - extension was updated and this is the old instance of content script
         *
         * Any async operations can be ignored here, but sync ones should run to completion.
         *
         * Regular message passing errors are returned via rejected promise or runtime.lastError.
         */
        if (isExtensionContextInvalidatedError(error)) {
            cleanup();
        }
    }
}

function notifyOfColorScheme(isDark: boolean): void {
    sendMessage({type: MessageTypeCStoBG.COLOR_SCHEME_CHANGE, data: {isDark}});
}

function updateEventListeners(): void {
    notifyOfColorScheme(isSystemDarkModeEnabled());
    if (documentIsVisible()) {
        runColorSchemeChangeDetector(notifyOfColorScheme);
    } else {
        stopColorSchemeChangeDetector();
    }
}

setDocumentVisibilityListener(updateEventListeners);
updateEventListeners();
