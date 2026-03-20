const KNOWN_DEAD_CONTEXT_MESSAGES = [
    'Extension context invalidated',
    'Could not establish connection. Receiving end does not exist',
];

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
    return typeof message === 'string' &&
        KNOWN_DEAD_CONTEXT_MESSAGES.some((m) => message.includes(m));
}
