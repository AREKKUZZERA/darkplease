const EXTENSION_CONTEXT_INVALIDATED_MESSAGE = 'Extension context invalidated';

export function isExtensionContextValid(): boolean {
    try {
        return typeof chrome !== 'undefined' &&
            typeof chrome.runtime?.sendMessage === 'function' &&
            typeof chrome.runtime?.onMessage?.addListener === 'function';
    } catch (error) {
        return !isExtensionContextInvalidatedError(error);
    }
}

export function isExtensionContextInvalidatedError(error: unknown): boolean {
    if (!error) {
        return false;
    }

    const message = typeof error === 'string' ? error : (error as {message?: unknown}).message;
    return typeof message === 'string' && message.includes(EXTENSION_CONTEXT_INVALIDATED_MESSAGE);
}
